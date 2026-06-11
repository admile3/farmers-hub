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

function centsToDollars(value) {
  return Number(((Number(value) || 0) / 100).toFixed(2));
}

function getSquareBaseUrl(environment) {
  return environment === "sandbox"
    ? "https://connect.squareupsandbox.com"
    : "https://connect.squareup.com";
}

function normalizeDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function toBeginTime(dateString) {
  return `${dateString}T00:00:00.000Z`;
}

function toEndTime(dateString) {
  return `${dateString}T23:59:59.999Z`;
}

async function fetchSquarePayments({ accessToken, environment, startDate, endDate }) {
  const baseUrl = getSquareBaseUrl(environment);
  const payments = [];
  let cursor = "";

  do {
    const params = new URLSearchParams({
      begin_time: toBeginTime(startDate),
      end_time: toEndTime(endDate),
      sort_order: "ASC"
    });

    if (cursor) params.set("cursor", cursor);

    const response = await fetch(`${baseUrl}/v2/payments?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2025-06-18",
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Square payments fetch failed:", data);
      throw new Error(
        data?.errors?.[0]?.detail ||
          data?.errors?.[0]?.code ||
          "Could not fetch Square payments."
      );
    }

    payments.push(...(Array.isArray(data.payments) ? data.payments : []));
    cursor = data.cursor || "";
  } while (cursor);

  return payments;
}

function groupPaymentsByDay(payments = []) {
  return payments.reduce((days, payment) => {
    if (payment.status && payment.status !== "COMPLETED") return days;

    const date = String(payment.created_at || "").slice(0, 10);
    if (!date) return days;

    const paymentAmount = centsToDollars(payment.amount_money?.amount || 0);
    const tipAmount = centsToDollars(payment.tip_money?.amount || 0);

    const feeAmount = Array.isArray(payment.processing_fee)
      ? payment.processing_fee.reduce(
          (sum, fee) => sum + centsToDollars(fee.amount_money?.amount || 0),
          0
        )
      : 0;

    const current = days[date] || {
      saleDate: date,
      paymentCount: 0,
      grossSales: 0,
      fees: 0,
      tips: 0,
      netSales: 0,
      squarePaymentIds: []
    };

    current.paymentCount += 1;
    current.grossSales = Number((current.grossSales + paymentAmount).toFixed(2));
    current.fees = Number((current.fees + feeAmount).toFixed(2));
    current.tips = Number((current.tips + tipAmount).toFixed(2));
    current.netSales = Number((current.grossSales - current.fees).toFixed(2));
    current.squarePaymentIds.push(payment.id);

    return {
      ...days,
      [date]: current
    };
  }, {});
}

async function saveDailySquareSales({ db, uid, dailyTotals }) {
  const saved = [];

  for (const dailyTotal of Object.values(dailyTotals)) {
    const saleId = `square-daily-${dailyTotal.saleDate}`;
    const saleRef = db.doc(`users/${uid}/sales/${saleId}`);

    await saleRef.set(
      {
        id: saleId,
        entryMode: "daily-total",
        source: "square",
        saleDate: dailyTotal.saleDate,
        saleType: "Market Day",
        marketName: "Square Import",
        paymentMethod: "Square",
        paymentStatus: "Paid",
        lines: [],
        grossSales: dailyTotal.grossSales,
        discounts: 0,
        fees: dailyTotal.fees,
        tax: 0,
        tips: dailyTotal.tips,
        netSales: dailyTotal.netSales,
        squarePaymentCount: dailyTotal.paymentCount,
        squarePaymentIds: dailyTotal.squarePaymentIds,
        notes: `Imported from Square. ${dailyTotal.paymentCount} payment${
          dailyTotal.paymentCount === 1 ? "" : "s"
        }.`,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        importedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    saved.push({
      id: saleId,
      ...dailyTotal
    });
  }

  return saved;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }

    const { uid, startDate, endDate } = req.body || {};

    if (!uid) {
      return res.status(400).json({
        error: "Missing user id."
      });
    }

    const cleanStartDate = normalizeDateInput(startDate);
    const cleanEndDate = normalizeDateInput(endDate);

    if (!cleanStartDate || !cleanEndDate) {
      return res.status(400).json({
        error: "Start date and end date are required."
      });
    }

    const db = getAdminDb();

    const squareDoc = await db.doc(`users/${uid}/integrations/square`).get();

    if (!squareDoc.exists) {
      return res.status(400).json({
        error: "Square is not connected."
      });
    }

    const squareConnection = squareDoc.data();

    if (!squareConnection?.connected || !squareConnection?.accessToken) {
      return res.status(400).json({
        error: "Square is not connected."
      });
    }

    const payments = await fetchSquarePayments({
      accessToken: squareConnection.accessToken,
      environment: squareConnection.environment || process.env.SQUARE_ENVIRONMENT || "production",
      startDate: cleanStartDate,
      endDate: cleanEndDate
    });

    const dailyTotals = groupPaymentsByDay(payments);
    const saved = await saveDailySquareSales({
      db,
      uid,
      dailyTotals
    });

    await db.doc(`users/${uid}/integrations/square`).set(
      {
        lastImportStartDate: cleanStartDate,
        lastImportEndDate: cleanEndDate,
        lastImportCount: saved.length,
        lastImportedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      paymentCount: payments.length,
      dailyRecordCount: saved.length,
      imported: saved
    });
  } catch (error) {
    console.error("Square Import Sales Error:", error);

    return res.status(500).json({
      error: error.message || "Square import failed."
    });
  }
}
