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

function permitGrantCollection(userId) {
  return collection(db, "users", userId, "permitGrantItems");
}

export async function getPermitGrantItems(userId) {
  const q = query(permitGrantCollection(userId), orderBy("dueDate", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function savePermitGrantItem(userId, item) {
  const itemId = item.id || `permit-grant-${Date.now()}`;
  const docRef = doc(db, "users", userId, "permitGrantItems", itemId);

  await setDoc(
    docRef,
    {
      ...item,
      id: itemId,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return itemId;
}

export async function deletePermitGrantItem(userId, itemId) {
  const docRef = doc(db, "users", userId, "permitGrantItems", itemId);
  await deleteDoc(docRef);
}
