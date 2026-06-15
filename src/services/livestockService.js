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

function userCollection(userId, collectionName) {
  return collection(db, "users", userId, collectionName);
}

export async function getLivestockBatches(userId) {
  if (!userId) return [];

  const q = query(
    userCollection(userId, "livestockBatches"),
    orderBy("name")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function createLivestockBatch(userId, batch) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const docRef = await addDoc(
    userCollection(userId, "livestockBatches"),
    {
      ...batch,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  );

  return docRef.id;
}

export async function updateLivestockBatch(
  userId,
  batchId,
  updates
) {
  if (!userId || !batchId) {
    throw new Error("User ID and batch ID are required.");
  }

  const docRef = doc(
    db,
    "users",
    userId,
    "livestockBatches",
    batchId
  );

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteLivestockBatch(
  userId,
  batchId
) {
  if (!userId || !batchId) {
    throw new Error("User ID and batch ID are required.");
  }

  const docRef = doc(
    db,
    "users",
    userId,
    "livestockBatches",
    batchId
  );

  await deleteDoc(docRef);
}
