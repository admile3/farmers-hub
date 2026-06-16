import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import { db } from "../firebase";

function apothecaryCollection(userId) {
  return collection(db, "users", userId, "farmApothecaryBatches");
}

export async function getApothecaryBatches(userId) {
  if (!userId) return [];

  const apothecaryQuery = query(apothecaryCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(apothecaryQuery);

  return snapshot.docs.map((batchDoc) => ({
    id: batchDoc.id,
    ...batchDoc.data()
  }));
}

export async function createApothecaryBatch(userId, batch) {
  if (!userId) {
    throw new Error("A user ID is required to create an apothecary batch.");
  }

  const batchRef = await addDoc(apothecaryCollection(userId), {
    ...batch,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return batchRef.id;
}

export async function updateApothecaryBatch(userId, batchId, updates) {
  if (!userId || !batchId) {
    throw new Error("A user ID and apothecary batch ID are required.");
  }

  const batchRef = doc(db, "users", userId, "farmApothecaryBatches", batchId);

  await updateDoc(batchRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteApothecaryBatch(userId, batchId) {
  if (!userId || !batchId) {
    throw new Error("A user ID and apothecary batch ID are required.");
  }

  const batchRef = doc(db, "users", userId, "farmApothecaryBatches", batchId);
  await deleteDoc(batchRef);
}
