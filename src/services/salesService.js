import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc
} from "firebase/firestore";

import { db } from "../firebase";

function makeSaleId() {
  return `sale-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function cleanSaleLine(line = {}) {
  const quantity = cleanNumber(line.quantity, 0);
  const unitPrice = cleanNumber(line.unitPrice, 0);
  const discount = cleanNumber(line.discount, 0);
  const lineTotal =
    line.lineTotal !== undefined
      ? cleanNumber(line.lineTotal, 0)
      : Math.max(quantity * unitPrice - discount, 0);

  return {
    id: line.id || `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,

    productId: cleanText(line.productId),
    productName: cleanText(line.productName),
    productCategory: cleanText(line.productCategory),
    variantId: cleanText(line.variantId),
    variantName: cleanText(line.variantName),

    quantity,
    unit: cleanText(line.unit, "each"),
    unitPrice,
    discount,
    lineTotal,

    inventoryItemId: cleanText(line.inventoryItemId),
    deductFromInventory: Boolean(line.deductFromInventory),

    notes: cleanText(line.notes)
  };
}

function calculateSaleTotals(sale = {}) {
  const lines = Array.isArray(sale.lines) ? sale.lines : [];
  const grossSalesFromLines = lines.reduce(
    (total, line) => total + cleanNumber(line.lineTotal, 0),
    0
  );

  const grossSales =
    sale.entryMode === "daily-total"
      ? cleanNumber(sale.grossSales, 0)
      : grossSalesFromLines;

  const discounts = cleanNumber(sale.discounts, 0);
  const fees = cleanNumber(sale.fees, 0);
  const tax = cleanNumber(sale.tax, 0);
  const tips = cleanNumber(sale.tips, 0);

  const netSales =
    sale.netSales !== undefined && sale.netSales !== ""
      ? cleanNumber(sale.netSales, 0)
      : Math.max(grossSales - discounts - fees + tax + tips, 0);

  return {
    grossSales,
    discounts,
    fees,
    tax,
    tips,
    netSales
  };
}

function cleanSale(sale = {}) {
  const now = new Date().toISOString();
  const lines = Array.isArray(sale.lines) ? sale.lines.map(cleanSaleLine) : [];
  const totals = calculateSaleTotals({
    ...sale,
    lines
  });

  return {
    ...sale,

    id: sale.id || makeSaleId(),

    entryMode: sale.entryMode || "line-items",
    source: sale.source || "manual",
    sourceOrderId: cleanText(sale.sourceOrderId),
    squarePaymentId: cleanText(sale.squarePaymentId),
    squareOrderId: cleanText(sale.squareOrderId),

    saleDate: sale.saleDate || now.slice(0, 10),
    saleType: sale.saleType || "Individual Sale",

    customerId: cleanText(sale.customerId),
    customerName: cleanText(sale.customerName),

    marketName: cleanText(sale.marketName),
    paymentMethod: sale.paymentMethod || "Not Recorded",
    paymentStatus: sale.paymentStatus || "Paid",

    lines,

    grossSales: totals.grossSales,
    discounts: totals.discounts,
    fees: totals.fees,
    tax: totals.tax,
    tips: totals.tips,
    netSales: totals.netSales,

    notes: cleanText(sale.notes),

    updatedAt: now,
    createdAt: sale.createdAt || now
  };
}

function salesCollection(userId) {
  return collection(db, "users", userId, "sales");
}

export async function getSales(userId) {
  if (!userId) return [];

  const salesRef = salesCollection(userId);
  const snapshot = await getDocs(query(salesRef, orderBy("saleDate", "desc")));

  return snapshot.docs.map((saleDoc) => ({
    id: saleDoc.id,
    ...saleDoc.data()
  }));
}

export async function saveSale(userId, sale) {
  if (!userId) {
    throw new Error("User ID is required to save a sale.");
  }

  const clean = cleanSale(sale);
  const saleRef = doc(db, "users", userId, "sales", clean.id);

  await setDoc(saleRef, clean, { merge: true });

  return clean.id;
}

export async function deleteSale(userId, saleId) {
  if (!userId || !saleId) return;

  const saleRef = doc(db, "users", userId, "sales", saleId);

  await deleteDoc(saleRef);
}

export async function saveDailySalesEntry(userId, entry = {}) {
  return saveSale(userId, {
    ...entry,
    entryMode: "daily-total",
    source: entry.source || "manual",
    saleType: entry.saleType || "Market Day",
    lines: []
  });
}

export async function convertOrderToSale(userId, order = {}) {
  if (!userId) {
    throw new Error("User ID is required to convert an order to a sale.");
  }

  if (!order.id) {
    throw new Error("An order ID is required to convert an order to a sale.");
  }

  const lines = Array.isArray(order.items)
    ? order.items.map((item) =>
        cleanSaleLine({
          productId: item.productId,
          productName: item.productName || item.name,
          productCategory: item.category,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice || item.price,
          discount: item.discount,
          lineTotal: item.lineTotal || item.total,
          inventoryItemId: item.inventoryItemId,
          deductFromInventory: true,
          notes: item.notes
        })
      )
    : [];

  const sale = {
    entryMode: "line-items",
    source: "order",
    sourceOrderId: order.id,

    saleDate: order.completedAt
      ? String(order.completedAt).slice(0, 10)
      : new Date().toISOString().slice(0, 10),

    saleType: order.saleType || order.orderType || "Order",
    customerId: order.customerId || "",
    customerName: order.customerName || "",

    paymentMethod: order.paymentMethod || "Not Recorded",
    paymentStatus: order.paymentStatus || "Paid",

    lines,

    grossSales: order.subtotal || order.total || 0,
    discounts: order.discount || 0,
    fees: order.fees || 0,
    tax: order.tax || 0,
    tips: order.tips || 0,
    netSales: order.total || order.netSales || order.subtotal || 0,

    notes: order.notes
      ? `Converted from order. ${order.notes}`
      : "Converted from order."
  };

  return saveSale(userId, sale);
}

export function summarizeSales(sales = []) {
  const safeSales = Array.isArray(sales) ? sales : [];

  const totalGrossSales = safeSales.reduce(
    (total, sale) => total + cleanNumber(sale.grossSales, 0),
    0
  );

  const totalNetSales = safeSales.reduce(
    (total, sale) => total + cleanNumber(sale.netSales, 0),
    0
  );

  const bestSale = safeSales.reduce((best, sale) => {
    if (!best) return sale;
    return cleanNumber(sale.netSales, 0) > cleanNumber(best.netSales, 0)
      ? sale
      : best;
  }, null);

  const dailyTotals = safeSales.reduce((totals, sale) => {
    const date = sale.saleDate || "Unscheduled";
    const existingTotal = totals[date] || 0;

    return {
      ...totals,
      [date]: existingTotal + cleanNumber(sale.netSales, 0)
    };
  }, {});

  const bestSalesDay = Object.entries(dailyTotals).reduce(
    (best, [date, total]) => {
      if (!best) {
        return {
          date,
          total
        };
      }

      return total > best.total
        ? {
            date,
            total
          }
        : best;
    },
    null
  );

  return {
    totalSalesCount: safeSales.length,
    totalGrossSales,
    totalNetSales,
    averageSale:
      safeSales.length > 0 ? totalNetSales / safeSales.length : 0,
    bestSale,
    bestSalesDay,
    dailyTotals
  };
}
