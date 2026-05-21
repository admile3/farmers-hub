import { randomUUID } from "crypto";
import { Client, Environment } from "square";

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { plan, email } = req.body;

    let planVariationId = "";

    if (plan === "monthly") {
      planVariationId = process.env.SQUARE_MONTHLY_PLAN_VARIATION_ID;
    } else if (plan === "annual") {
      planVariationId = process.env.SQUARE_ANNUAL_PLAN_VARIATION_ID;
    } else {
      return res.status(400).json({
        error: "Invalid subscription plan"
      });
    }

    if (!planVariationId) {
      return res.status(500).json({
        error: "Missing Square plan variation ID"
      });
    }

    const response = await client.checkoutApi.createPaymentLink({
      idempotencyKey: randomUUID(),

      checkoutOptions: {
        subscriptionPlanId: planVariationId,
        redirectUrl: `${process.env.VITE_APP_URL}/subscribe-success`
      },

      prePopulatedData: {
        buyerEmail: email || undefined
      }
    });

    return res.status(200).json({
      checkoutUrl: response.result.paymentLink.url
    });
  } catch (error) {
    console.error("Square Checkout Error:", error);

    return res.status(500).json({
      error: "Could not create Square checkout"
    });
  }
}