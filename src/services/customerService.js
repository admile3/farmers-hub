import {
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

function customersCollection(userId) {
  return collection(db, "users", userId, "customers");
}

export async function getCustomers(userId) {
  const q = query(customersCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function saveCustomer(userId, customer) {
  const customerId = customer.id || `customer-${Date.now()}`;
  const customerRef = doc(db, "users", userId, "customers", customerId);

  await setDoc(
    customerRef,
    {
      ...customer,
      id: customerId,
      name: customer.name || "Untitled Customer",
      updatedAt: serverTimestamp(),
      createdAt: customer.createdAt || serverTimestamp()
    },
    { merge: true }
  );

  return customerId;
}

export async function deleteCustomer(userId, customerId) {
  await deleteDoc(doc(db, "users", userId, "customers", customerId));
}
