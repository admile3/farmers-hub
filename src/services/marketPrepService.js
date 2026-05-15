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

function marketPrepCollection(userId) {
  return collection(db, "users", userId, "marketPrepPlans");
}

export async function getMarketPrepPlans(userId) {
  const q = query(marketPrepCollection(userId), orderBy("marketDate", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function saveMarketPrepPlan(userId, plan) {
  const planId = plan.id || `market-${Date.now()}`;
  const docRef = doc(db, "users", userId, "marketPrepPlans", planId);

  await setDoc(
    docRef,
    {
      ...plan,
      id: planId,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return planId;
}

export async function deleteMarketPrepPlan(userId, planId) {
  const docRef = doc(db, "users", userId, "marketPrepPlans", planId);
  await deleteDoc(docRef);
}
