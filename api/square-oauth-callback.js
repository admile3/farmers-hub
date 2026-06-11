import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getAdminDb() {
  if (!process.env.FIREBASE_PROJECT_ID) throw new Error("Missing FIREBASE_PROJECT_ID");
  if (!process.env.FIREBASE_CLIENT_EMAIL) throw new Error("Missing FIREBASE_CLIENT_EMAIL");
  if (!process.env.FIREBASE_PRIVATE_KEY) throw new Error("Missing FIREBASE_PRIVATE_KEY");

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

function decodeState(state) {
  try {
    return JSON.parse(Buffer.from(String(state), "base64").toString("utf8"));
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.redirect(
        `/sales?square=error&message=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      return res.redirect("/sales?square=error&message=Missing authorization code");
    }

    const decodedState = decodeState(state);
    const uid = decodedState.uid;

    if (!uid) {
      return res.redirect("/sales?square=error&message=Missing user id");
    }

    const applicationId = process.env.SQUARE_APPLICATION_ID;
    const applicationSecret = process.env.SQUARE_APPLICATION_SECRET;
    const redirectUrl = process.env.SQUARE_REDIRECT_URL;
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT || "production";

    if (!applicationId) throw new Error("Missing SQUARE_APPLICATION_ID");
    if (!applicationSecret) throw new Error("Missing SQUARE_APPLICATION_SECRET");
    if (!redirectUrl) throw new Error("Missing SQUARE_REDIRECT_URL");

    const tokenUrl =
      squareEnvironment === "sandbox"
        ? "https://connect.squareupsandbox.com/oauth2/token"
        : "https://connect.squareup.com/oauth2/token";

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": "2025-06-18"
      },
      body: JSON.stringify({
        client_id: applicationId,
        client_secret: applicationSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUrl
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Square token exchange failed:", tokenData);
      throw new Error(tokenData?.message || tokenData?.detail || "Square token exchange failed");
    }

    const db = getAdminDb();

    await db.doc(`users/${uid}/integrations/square`).set(
      {
        connected: true,
        environment: squareEnvironment,
        merchantId: tokenData.merchant_id || "",
        accessToken: tokenData.access_token || "",
        refreshToken: tokenData.refresh_token || "",
        tokenType: tokenData.token_type || "bearer",
        expiresAt: tokenData.expires_at || "",
        shortLived: Boolean(tokenData.short_lived),
        updatedAt: FieldValue.serverTimestamp(),
        connectedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return res.redirect("/sales?square=connected");
  } catch (err) {
    console.error("Square OAuth Callback Error:", err);

    return res.redirect(
      `/sales?square=error&message=${encodeURIComponent(err.message || "Square connection failed")}`
    );
  }
}
