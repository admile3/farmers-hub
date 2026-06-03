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

function cleanInventoryItem(item = {}) {
  return {
    name: item.name || "",
    category: item.category || "Finished Goods",
    sourceModule: item.sourceModule || "Manual",

    quantityOnHand:
      item.quantityOnHand === "" ||
      item.quantityOnHand === null ||
      item.quantityOnHand === undefined
        ? ""
        : Number(item.quantityOnHand),

    unit: item.unit || "each",

    parLevel:
      item.parLevel === "" ||
      item.parLevel === null ||
      item.parLevel === undefined
        ? ""
        : Number(item.parLevel),

    reorderPoint:
      item.reorderPoint === "" ||
      item.reorderPoint === null ||
      item.reorderPoint === undefined
        ? ""
        : Number(item.reorderPoint),

    storageLocation: item.storageLocation || "",

    costPerUnit:
      item.costPerUnit === "" ||
      item.costPerUnit === null ||
      item.costPerUnit === undefined
        ? ""
        : Number(item.costPerUnit),

    bestByDate: item.bestByDate || "",
    status: item.status || "In Stock",
    notes: item.notes || "",

    updatedAt: serverTimestamp()
  };
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
    throw new Error(
      "A user ID is required to save an inventory item."
    );
  }

  const cleanItem = cleanInventoryItem(item);

  if (item.id) {
    const itemRef = doc(
      db,
      "users",
      userId,
      "inventoryItems",
      item.id
    );

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

  const itemRef = await addDoc(
    inventoryCollection(userId),
    {
      ...cleanItem,
      createdAt: serverTimestamp()
    }
  );

  return itemRef.id;
}

export async function deleteInventoryItem(userId, itemId) {
  if (!userId || !itemId) {
    throw new Error(
      "A user ID and inventory item ID are required."
    );
  }

  const itemRef = doc(
    db,
    "users",
    userId,
    "inventoryItems",
    itemId
  );

  await deleteDoc(itemRef);
}
