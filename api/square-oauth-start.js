export default async function handler(req, res) {
  try {
    const applicationId = process.env.SQUARE_APPLICATION_ID;
    const redirectUrl = process.env.SQUARE_REDIRECT_URL;

    if (!applicationId) {
      return res.status(500).json({
        error: "Missing SQUARE_APPLICATION_ID"
      });
    }

    if (!redirectUrl) {
      return res.status(500).json({
        error: "Missing SQUARE_REDIRECT_URL"
      });
    }

    const { uid } = req.query;

    if (!uid) {
      return res.status(400).json({
        error: "Missing user id"
      });
    }

    const state = Buffer.from(
      JSON.stringify({
        uid,
        timestamp: Date.now()
      })
    ).toString("base64");

    const scopes = [
      "PAYMENTS_READ",
      "ORDERS_READ",
      "MERCHANT_PROFILE_READ"
    ];

    const authUrl =
      "https://connect.squareup.com/oauth2/authorize" +
      `?client_id=${encodeURIComponent(applicationId)}` +
      `&scope=${encodeURIComponent(scopes.join(" "))}` +
      `&session=false` +
      `&state=${encodeURIComponent(state)}`;

    return res.status(200).json({
      authUrl
    });
  } catch (error) {
    console.error("Square OAuth Start Error:", error);

    return res.status(500).json({
      error: error.message
    });
  }
}
