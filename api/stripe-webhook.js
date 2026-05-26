import Stripe from "stripe";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const config = {
  api: {
    bodyParser: false
  }
};

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function getAdminDb() {
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error("Missing FIREBASE_PROJECT_ID");
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error("Missing FIREBASE_CLIENT_EMAIL");
  }

  if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Missing FIREBASE_PRIVATE_KEY");
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      })
    });
  }

  return getFirestore();
}

function getAllowedModules(plan, selectedModule) {
  switch (plan) {
    case "basic":
      return selectedModule ? [selectedModule] : [];

    case "growth":
      return ["baking", "spice", "market"];

    case "pro":
      return "all";

    default:
      return [];
  }
}

async function updateUserSubscription({
  db,
  uid,
  status,
  plan,
  selectedModule,
  stripeCustomerId,
  stripeSubscriptionId
}) {
  if (!uid) return;

  const accountRef = db.doc(`users/${uid}/account/profile`);

  await accountRef.set(
    {
      subscriptionStatus: status,
      subscriptionPlan: status === "active" ? plan : null,
      allowedModules:
        status === "active" ? getAllowedModules(plan, selectedModule) : [],
      stripeCustomerId: stripeCustomerId || null,
      stripeSubscriptionId: stripeSubscriptionId || null,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({
      error: "Missing STRIPE_WEBHOOK_SECRET"
    });
  }

  const stripe = getStripe();
  const db = getAdminDb();

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const rawBody = await buffer(req);

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);

    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        await updateUserSubscription({
          db,
          uid: session.metadata?.uid,
          status: "active",
          plan: session.metadata?.plan,
          selectedModule: session.metadata?.selectedModule,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription
        });

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        const isActive =
          subscription.status === "active" ||
          subscription.status === "trialing";

        await updateUserSubscription({
          db,
          uid: subscription.metadata?.uid,
          status: isActive ? "active" : "expired",
          plan: subscription.metadata?.plan,
          selectedModule: subscription.metadata?.selectedModule,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await updateUserSubscription({
          db,
          uid: subscription.metadata?.uid,
          status: "expired",
          plan: null,
          selectedModule: null,
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id
        });

        break;
      }

      default:
        break;
    }

    return res.status(200).json({
      received: true
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return res.status(500).json({
      error: "Webhook handler failed.",
      message: error.message
    });
  }
}

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    readable.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    readable.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    readable.on("error", reject);
  });
}
