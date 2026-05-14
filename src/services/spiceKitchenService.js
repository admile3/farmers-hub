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

export async function getSpiceIngredients(userId) {
  const q = query(userCollection(userId, "spiceIngredients"), orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function createSpiceIngredient(userId, ingredient) {
  const docRef = await addDoc(userCollection(userId, "spiceIngredients"), {
    ...ingredient,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

export async function updateSpiceIngredient(userId, ingredientId, updates) {
  const docRef = doc(db, "users", userId, "spiceIngredients", ingredientId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteSpiceIngredient(userId, ingredientId) {
  const docRef = doc(db, "users", userId, "spiceIngredients", ingredientId);
  await deleteDoc(docRef);
}

export async function getSpiceRecipes(userId) {
  const q = query(userCollection(userId, "spiceRecipes"), orderBy("name"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function createSpiceRecipe(userId, recipe) {
  const docRef = await addDoc(userCollection(userId, "spiceRecipes"), {
    ...recipe,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return docRef.id;
}

export async function updateSpiceRecipe(userId, recipeId, updates) {
  const docRef = doc(db, "users", userId, "spiceRecipes", recipeId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteSpiceRecipe(userId, recipeId) {
  const docRef = doc(db, "users", userId, "spiceRecipes", recipeId);
  await deleteDoc(docRef);
}
