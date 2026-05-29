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

function productsCollection(userId) {
  return collection(db, "users", userId, "products");
}

export async function getProducts(userId) {
  const q = query(productsCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function saveProduct(userId, product) {
  const productId = product.id || `product-${Date.now()}`;
  const productRef = doc(db, "users", userId, "products", productId);

  await setDoc(
    productRef,
    {
      ...product,
      id: productId,
      name: product.name || "Untitled Product",
      updatedAt: serverTimestamp(),
      createdAt: product.createdAt || serverTimestamp()
    },
    { merge: true }
  );

  return productId;
}

export async function deleteProduct(userId, productId) {
  await deleteDoc(doc(db, "users", userId, "products", productId));
}
