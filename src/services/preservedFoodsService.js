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

function ingredientsCollection(userId) {
  return collection(db, "users", userId, "preservedFoodsIngredients");
}

function recipesCollection(userId) {
  return collection(db, "users", userId, "preservedFoodsRecipes");
}

function batchesCollection(userId) {
  return collection(db, "users", userId, "preservedFoodsBatches");
}

function cleanNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}

export async function getPreservedIngredients(userId) {
  if (!userId) return [];

  const q = query(ingredientsCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function createPreservedIngredient(userId, ingredient) {
  const ref = await addDoc(ingredientsCollection(userId), {
    name: ingredient.name || "",
    category: ingredient.category || "Other",
    supplier: ingredient.supplier || "",
    cost: cleanNumber(ingredient.cost),
    costUnit: ingredient.costUnit || "each",
    notes: ingredient.notes || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function updatePreservedIngredient(userId, ingredientId, ingredient) {
  await updateDoc(doc(db, "users", userId, "preservedFoodsIngredients", ingredientId), {
    name: ingredient.name || "",
    category: ingredient.category || "Other",
    supplier: ingredient.supplier || "",
    cost: cleanNumber(ingredient.cost),
    costUnit: ingredient.costUnit || "each",
    notes: ingredient.notes || "",
    updatedAt: serverTimestamp()
  });
}

export async function deletePreservedIngredient(userId, ingredientId) {
  await deleteDoc(doc(db, "users", userId, "preservedFoodsIngredients", ingredientId));
}

export async function getPreservedRecipes(userId) {
  if (!userId) return [];

  const q = query(recipesCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function createPreservedRecipe(userId, recipe) {
  const ref = await addDoc(recipesCollection(userId), {
    ...recipe,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function updatePreservedRecipe(userId, recipeId, recipe) {
  await updateDoc(doc(db, "users", userId, "preservedFoodsRecipes", recipeId), {
    ...recipe,
    updatedAt: serverTimestamp()
  });
}

export async function deletePreservedRecipe(userId, recipeId) {
  await deleteDoc(doc(db, "users", userId, "preservedFoodsRecipes", recipeId));
}

export async function getPreservedBatches(userId) {
  if (!userId) return [];

  const q = query(batchesCollection(userId), orderBy("productionDate", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function createPreservedBatch(userId, batch) {
  const ref = await addDoc(batchesCollection(userId), {
    ...batch,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function deletePreservedBatch(userId, batchId) {
  await deleteDoc(doc(db, "users", userId, "preservedFoodsBatches", batchId));
}
