import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

export default async function handler(req, res) {
  try {
    const { uid } = req.query;

    if (!uid) {
      return res.status(400).json({
        connected: false,
        error: "Missing user id."
      });
    }

    const db = getAdminDb();
    const squareDoc = await db.doc(`users/${uid}/integrations/square`).get();

    if (!squareDoc.exists) {
      return res.status(200).json({
        connected: false
      });
    }

    const data = squareDoc.data();

    return res.status(200).json({
      connected: Boolean(data.connected && data.accessToken),
      merchantId: data.merchantId || "",
      environment: data.environment || "production",
      expiresAt: data.expiresAt || "",
      lastImportedAt: data.lastImportedAt || null,
      lastImportStartDate: data.lastImportStartDate || "",
      lastImportEndDate: data.lastImportEndDate || "",
      lastImportCount: data.lastImportCount || 0
    });
  } catch (error) {
    console.error("Square Connection Status Error:", error);

    return res.status(500).json({
      connected: false,
      error: error.message || "Could not check Square connection."
    });
  }
}
