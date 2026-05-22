import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { plan, email } = req.body;

    const priceId =
      plan === "annual"
        ? process.env.STRIPE_ANNUAL_PRICE_ID
        : process.env.STRIPE_MONTHLY_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ error: "Missing Stripe price ID." });
    }

    const baseUrl =
      process.env.SITE_URL || "https://farmers-hub-inky.vercel.app";

    const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [
    {
      price: priceId,
      quantity: 1
    }
  ],
  subscription_data: {
    trial_period_days: 15
  },
  success_url: `${baseUrl}/?subscription=success`,
  cancel_url: `${baseUrl}/subscribe`
});

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return res.status(500).json({
      error: "Could not create Stripe checkout session.",
      message: error.message,
    });
  }
}
