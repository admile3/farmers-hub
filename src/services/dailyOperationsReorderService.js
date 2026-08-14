import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import { db } from "../firebase";

function reorderItemCollection(userId) {
  return collection(db, "users", userId, "dailyOperationReorderItems");
}

function reorderRequestCollection(userId) {
  return collection(db, "users", userId, "dailyOperationReorderRequests");
}

function randomToken(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }

  return value;
}

function cleanReorderItem(item = {}) {
  return {
    name: item.name || "",
    category: item.category || "General Supplies",
    vendor: item.vendor || "",
    purchaseUrl: item.purchaseUrl || "",
    notes: item.notes || "",
    barcode: item.barcode || `FH-REORDER-${randomToken()}`,
    active: item.active !== false,
    sortOrder: Number(item.sortOrder) || 0,
    updatedAt: serverTimestamp()
  };
}

export async function getReorderItems(userId) {
  if (!userId) return [];

  const snapshot = await getDocs(
    query(reorderItemCollection(userId), orderBy("sortOrder", "asc"))
  );

  return snapshot.docs.map((itemDoc) => ({
    id: itemDoc.id,
    ...itemDoc.data()
  }));
}

export async function saveReorderItem(userId, item) {
  if (!userId) throw new Error("A user ID is required to save a re-order item.");

  const clean = cleanReorderItem(item);

  if (item.id) {
    await setDoc(
      doc(db, "users", userId, "dailyOperationReorderItems", item.id),
      { ...clean, createdAt: item.createdAt || null },
      { merge: true }
    );
    return item.id;
  }

  const ref = await addDoc(reorderItemCollection(userId), {
    ...clean,
    createdAt: serverTimestamp()
  });

  return ref.id;
}

export async function deleteReorderItem(userId, itemId) {
  if (!userId || !itemId) throw new Error("A user ID and re-order item ID are required.");
  await deleteDoc(doc(db, "users", userId, "dailyOperationReorderItems", itemId));
}

export async function getReorderRequests(userId) {
  if (!userId) return [];

  const snapshot = await getDocs(
    query(reorderRequestCollection(userId), orderBy("requestedAt", "desc"))
  );

  return snapshot.docs.map((requestDoc) => ({
    id: requestDoc.id,
    ...requestDoc.data()
  }));
}

export async function addReorderRequest(userId, item, method = "manual") {
  if (!userId || !item?.id) throw new Error("A user ID and re-order item are required.");

  const requests = await getReorderRequests(userId);
  const existing = requests.find(
    (request) => request.itemId === item.id && request.status === "needed"
  );

  if (existing) {
    return { id: existing.id, alreadyExists: true };
  }

  const ref = await addDoc(reorderRequestCollection(userId), {
    itemId: item.id,
    itemName: item.name || "",
    category: item.category || "General Supplies",
    vendor: item.vendor || "",
    purchaseUrl: item.purchaseUrl || "",
    notes: item.notes || "",
    status: "needed",
    requestMethod: method,
    requestedAt: serverTimestamp(),
    orderedAt: null,
    createdAt: serverTimestamp()
  });

  return { id: ref.id, alreadyExists: false };
}

export async function markReorderRequestOrdered(userId, requestId) {
  if (!userId || !requestId) throw new Error("A user ID and re-order request ID are required.");

  await setDoc(
    doc(db, "users", userId, "dailyOperationReorderRequests", requestId),
    {
      status: "ordered",
      orderedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function reopenReorderRequest(userId, requestId) {
  if (!userId || !requestId) throw new Error("A user ID and re-order request ID are required.");

  await setDoc(
    doc(db, "users", userId, "dailyOperationReorderRequests", requestId),
    {
      status: "needed",
      orderedAt: null,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function deleteReorderRequest(userId, requestId) {
  if (!userId || !requestId) throw new Error("A user ID and re-order request ID are required.");
  await deleteDoc(doc(db, "users", userId, "dailyOperationReorderRequests", requestId));
}
