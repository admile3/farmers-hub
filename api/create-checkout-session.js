import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID,
  growth: process.env.STRIPE_GROWTH_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID
};

const VALID_MODULES = [
  "baking",
  "spice",
  "market",
  "pricing",
  "permit-grants",
  "lists",
  "calendar"
];

function cleanSelectedModules(selectedModules) {
  if (!Array.isArray(selectedModules)) return [];

  return selectedModules
    .filter((moduleKey) => VALID_MODULES.includes(moduleKey))
    .filter((moduleKey, index, array) => array.indexOf(moduleKey) === index);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { plan, email, uid } = req.body;

    const selectedModules = cleanSelectedModules(req.body.selectedModules);

    if (!uid) {
      return res.status(400).json({ error: "Missing Firebase user ID." });
    }

    if (!email) {
      return res.status(400).json({ error: "Missing user email." });
    }

    if (!plan || !PRICE_IDS[plan]) {
      return res.status(400).json({
        error: "Invalid plan selected.",
        validPlans: Object.keys(PRICE_IDS)
      });
    }

    if (plan === "basic" && selectedModules.length !== 1) {
      return res.status(400).json({
        error: "Basic plan requires exactly one selected module.",
        validModules: VALID_MODULES
      });
    }

    if (plan === "growth" && selectedModules.length !== 3) {
      return res.status(400).json({
        error: "Growth plan requires exactly three selected modules.",
        validModules: VALID_MODULES
      });
    }

    const finalSelectedModules =
      plan === "pro" ? VALID_MODULES : selectedModules;

    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return res.status(500).json({
        error: `Missing Stripe price ID for ${plan} plan.`
      });
    }

    const baseUrl =
      process.env.SITE_URL || "https://farmers-hub-inky.vercel.app";

    const modulesMetadata = finalSelectedModules.join(",");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      client_reference_id: uid,
      metadata: {
        uid,
        plan,
        selectedModules: modulesMetadata
      },
      subscription_data: {
        metadata: {
          uid,
          plan,
          selectedModules: modulesMetadata
        }
      },
      success_url: `${baseUrl}/?subscription=success`,
      cancel_url: `${baseUrl}/subscribe`
    });

    return res.status(200).json({
      url: session.url
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return res.status(500).json({
      error: "Could not create Stripe checkout session.",
      message: error.message
    });
  }
}
