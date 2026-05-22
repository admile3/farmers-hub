import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing customer email." });
    }

    const baseUrl =
      process.env.SITE_URL || "https://farmers-hub-inky.vercel.app";

    const customers = await stripe.customers.list({
      email,
      limit: 1
    });

    let customer = customers.data[0];

    if (!customer) {
      customer = await stripe.customers.create({
        email
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${baseUrl}/account-settings`
    });

    return res.status(200).json({
      url: session.url
    });
  } catch (error) {
    console.error("Stripe billing portal error:", error);

    return res.status(500).json({
      error: "Could not create billing portal session.",
      message: error.message
    });
  }
}
