export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;
    const environment = process.env.SQUARE_ENVIRONMENT || "sandbox";

    if (!accessToken || !locationId) {
      return res.status(500).json({
        error: "Missing Square environment variables.",
      });
    }

    const squareBaseUrl =
      environment === "production"
        ? "https://connect.squareup.com"
        : "https://connect.squareupsandbox.com";

    const { items, cartItems, lineItems, redirectUrl } = req.body;

    const products = items || cartItems || lineItems || [];

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: "No cart items were provided.",
      });
    }

    const squareLineItems = products.map((item) => {
      const name = item.name || item.title || "ArMi Farms Item";

      const quantity = String(item.quantity || item.qty || 1);

      const price =
        item.priceCents ??
        item.amountCents ??
        Math.round(Number(item.price || item.amount || 0) * 100);

      if (!price || price <= 0) {
        throw new Error(`Invalid price for item: ${name}`);
      }

      return {
        name,
        quantity,
        base_price_money: {
          amount: price,
          currency: "USD",
        },
      };
    });

    const idempotencyKey =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const response = await fetch(
      `${squareBaseUrl}/v2/online-checkout/payment-links`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Square-Version": "2025-05-21",
        },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          order: {
            location_id: locationId,
            line_items: squareLineItems,
          },
          checkout_options: {
            redirect_url:
              redirectUrl ||
              "https://www.armifarms.com/checkout-success",
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Square checkout error:", data);
      return res.status(response.status).json({
        error: "Square checkout failed.",
        details: data,
      });
    }

    return res.status(200).json({
      checkoutUrl: data.payment_link?.url,
      paymentLink: data.payment_link,
    });
  } catch (error) {
    console.error("Create checkout error:", error);

    return res.status(500).json({
      error: "Unable to create Square checkout.",
      message: error.message,
    });
  }
}
