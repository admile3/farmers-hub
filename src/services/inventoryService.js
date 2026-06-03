import {
  addDoc,
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

function inventoryCollection(userId) {
  return collection(db, "users", userId, "inventoryItems");
}

function cleanNumber(value) {
  if (value === "" || value === null || value === undefined) return "";

  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}

function cleanInventoryItem(item = {}) {
  return {
    name: item.name || "",
    category: item.category || "Finished Goods",
    sourceModule: item.sourceModule || "Manual",

    productId: item.productId || "",
    productName: item.productName || "",

    recipeId: item.recipeId || "",
    recipeName: item.recipeName || "",

    variantId: item.variantId || "",
    variantName: item.variantName || "",

    quantityOnHand: cleanNumber(item.quantityOnHand),
    unit: item.unit || "each",

    parLevel: cleanNumber(item.parLevel),
    reorderPoint: cleanNumber(item.reorderPoint),

    storageLocation: item.storageLocation || "",
    costPerUnit: cleanNumber(item.costPerUnit),

    bestByDate: item.bestByDate || "",
    status: item.status || "In Stock",
    notes: item.notes || "",

    updatedAt: serverTimestamp()
  };
}

function inventoryItemMatches(item = {}, match = {}) {
  const matchKeys = [
    "productId",
    "recipeId",
    "variantId",
    "variantName",
    "name",
    "sourceModule"
  ];

  return matchKeys.every((key) => {
    if (!match[key]) return true;
    return String(item[key] || "") === String(match[key] || "");
  });
}

export async function getInventoryItems(userId) {
  if (!userId) return [];

  const inventoryQuery = query(
    inventoryCollection(userId),
    orderBy("name", "asc")
  );

  const snapshot = await getDocs(inventoryQuery);

  return snapshot.docs.map((inventoryDoc) => ({
    id: inventoryDoc.id,
    ...inventoryDoc.data()
  }));
}

export async function saveInventoryItem(userId, item) {
  if (!userId) {
    throw new Error("A user ID is required to save an inventory item.");
  }

  const cleanItem = cleanInventoryItem(item);

  if (item.id) {
    const itemRef = doc(db, "users", userId, "inventoryItems", item.id);

    await setDoc(
      itemRef,
      {
        ...cleanItem,
        createdAt: item.createdAt || null
      },
      { merge: true }
    );

    return item.id;
  }

  const itemRef = await addDoc(inventoryCollection(userId), {
    ...cleanItem,
    createdAt: serverTimestamp()
  });

  return itemRef.id;
}

export async function deleteInventoryItem(userId, itemId) {
  if (!userId || !itemId) {
    throw new Error("A user ID and inventory item ID are required.");
  }

  const itemRef = doc(db, "users", userId, "inventoryItems", itemId);

  await deleteDoc(itemRef);
}

export async function findInventoryItem(userId, match = {}) {
  if (!userId) return null;

  const items = await getInventoryItems(userId);

  return items.find((item) => inventoryItemMatches(item, match)) || null;
}

export async function addQuantityToInventoryItem(userId, itemId, quantityToAdd) {
  if (!userId || !itemId) {
    throw new Error("A user ID and inventory item ID are required.");
  }

  const quantity = Number(quantityToAdd) || 0;

  const items = await getInventoryItems(userId);
  const currentItem = items.find((item) => item.id === itemId);

  if (!currentItem) {
    throw new Error("Inventory item could not be found.");
  }

  const currentQuantity = Number(currentItem.quantityOnHand) || 0;

  await saveInventoryItem(userId, {
    ...currentItem,
    quantityOnHand: currentQuantity + quantity
  });

  return itemId;
}

export async function findOrCreateInventoryItem(userId, match = {}, itemDefaults = {}) {
  if (!userId) {
    throw new Error("A user ID is required to find or create inventory.");
  }

  const existingItem = await findInventoryItem(userId, match);

  if (existingItem) {
    return existingItem;
  }

  const newItem = {
    ...itemDefaults,
    ...match,
    quantityOnHand: itemDefaults.quantityOnHand ?? 0
  };

  const newItemId = await saveInventoryItem(userId, newItem);

  return {
    id: newItemId,
    ...newItem
  };
}

export async function addQuantityToMatchedInventoryItem({
  userId,
  match = {},
  itemDefaults = {},
  quantityToAdd = 0
}) {
  if (!userId) {
    throw new Error("A user ID is required to update inventory.");
  }

  const quantity = Number(quantityToAdd) || 0;

  const inventoryItem = await findOrCreateInventoryItem(
    userId,
    match,
    itemDefaults
  );

  const currentQuantity = Number(inventoryItem.quantityOnHand) || 0;

  await saveInventoryItem(userId, {
    ...inventoryItem,
    ...itemDefaults,
    ...match,
    quantityOnHand: currentQuantity + quantity
  });

  return inventoryItem.id;
}
