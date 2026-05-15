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

function pricingCollection(userId) {
  return collection(db, "users", userId, "pricingCalculations");
}

export async function getPricingCalculations(userId) {
  const q = query(pricingCollection(userId), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function savePricingCalculation(userId, calculation) {
  const calculationId = calculation.id || `pricing-${Date.now()}`;
  const docRef = doc(db, "users", userId, "pricingCalculations", calculationId);

  await setDoc(
    docRef,
    {
      ...calculation,
      id: calculationId,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return calculationId;
}

export async function deletePricingCalculation(userId, calculationId) {
  const docRef = doc(db, "users", userId, "pricingCalculations", calculationId);
  await deleteDoc(docRef);
}
