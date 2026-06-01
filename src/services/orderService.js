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

function makeOrderId() {
  return `order-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanOrder(order) {
  const now = new Date().toISOString();

  return {
    ...order,
    id: order.id || makeOrderId(),
    updatedAt: now,
    createdAt: order.createdAt || now
  };
}

export async function getOrders(uid) {
  if (!uid) return [];

  const ordersRef = collection(db, "users", uid, "orders");
  const snapshot = await getDocs(
    query(ordersRef, orderBy("updatedAt", "desc"))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function saveOrder(uid, order) {
  if (!uid) {
    throw new Error("User ID is required to save an order.");
  }

  const clean = cleanOrder(order);

  const orderRef = doc(
    db,
    "users",
    uid,
    "orders",
    clean.id
  );

  await setDoc(orderRef, clean, { merge: true });

  return clean.id;
}

export async function deleteOrder(uid, orderId) {
  if (!uid || !orderId) return;

  const orderRef = doc(
    db,
    "users",
    uid,
    "orders",
    orderId
  );

  await deleteDoc(orderRef);
}
