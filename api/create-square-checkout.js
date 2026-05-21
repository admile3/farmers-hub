import { Client, Environment } from "square";

const squareClient = new Client({
  environment: Environment.Production,
  accessToken: process.env.SQUARE_ACCESS_TOKEN
});

const checkoutApi = squareClient.checkoutApi;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { plan } = req.body;

    let subscriptionPlanId = "";

    if (plan === "monthly") {
      subscriptionPlanId =
        process.env.SQUARE_MONTHLY_PLAN_VARIATION_ID;
    } else if (plan === "annual") {
      subscriptionPlanId =
        process.env.SQUARE_ANNUAL_PLAN_VARIATION_ID;
    } else {
      return res.status(400).json({
        error: "Invalid subscription plan"
      });
    }

    const response = await checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),

      quickPay: {
        name:
          plan === "monthly"
            ? "Farmers Hub Monthly"
            : "Farmers Hub Annual",

        priceMoney: {
          amount: plan === "monthly" ? 1000 : 11000,
          currency: "USD"
        }
      },

      checkoutOptions: {
        redirectUrl: `${process.env.VITE_APP_URL}/subscribe-success`
      },

      prePopulatedData: {
        buyerEmail: req.body.email || undefined
      },

      subscriptionPlanId
    });

    return res.status(200).json({
      checkoutUrl: response.result.paymentLink.url
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Could not create Square checkout"
    });
  }
}
