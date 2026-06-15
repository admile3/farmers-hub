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

function livestockCollection(userId) {
  return collection(db, "users", userId, "livestockBatches");
}

export async function getLivestockBatches(userId) {
  if (!userId) return [];

  const livestockQuery = query(livestockCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(livestockQuery);

  return snapshot.docs.map((batchDoc) => ({
    id: batchDoc.id,
    ...batchDoc.data()
  }));
}

export async function createLivestockBatch(userId, batch) {
  if (!userId) {
    throw new Error("A user ID is required to create a livestock batch.");
  }

  const batchRef = await addDoc(livestockCollection(userId), {
    ...batch,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return batchRef.id;
}

export async function updateLivestockBatch(userId, batchId, updates) {
  if (!userId || !batchId) {
    throw new Error("A user ID and livestock batch ID are required.");
  }

  const batchRef = doc(db, "users", userId, "livestockBatches", batchId);

  await updateDoc(batchRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteLivestockBatch(userId, batchId) {
  if (!userId || !batchId) {
    throw new Error("A user ID and livestock batch ID are required.");
  }

  const batchRef = doc(db, "users", userId, "livestockBatches", batchId);
  await deleteDoc(batchRef);
}
