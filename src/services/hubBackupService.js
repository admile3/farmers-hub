import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";

const BACKUP_COLLECTIONS = [
  "spiceIngredients",
  "spiceRecipes",
  "marketPrepPlans",
  "pricingCalculations",
  "permitGrantItems",
  "lists"
];

async function getCollectionData(userId, collectionName) {
  const snapshot = await getDocs(collection(db, "users", userId, collectionName));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

async function getListItems(userId, listId) {
  const snapshot = await getDocs(
    collection(db, "users", userId, "lists", listId, "items")
  );

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
}

export async function exportHubData(userId, userEmail = "") {
  const backup = {
    app: "Farmers Hub",
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedFrom: userEmail,
    data: {}
  };

  for (const collectionName of BACKUP_COLLECTIONS) {
    backup.data[collectionName] = await getCollectionData(userId, collectionName);
  }

  if (backup.data.lists?.length) {
    backup.data.listItems = {};

    for (const list of backup.data.lists) {
      backup.data.listItems[list.id] = await getListItems(userId, list.id);
    }
  } else {
    backup.data.listItems = {};
  }

  return backup;
}

export function downloadBackupFile(backup) {
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `farmers-hub-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

async function importCollectionData(userId, collectionName, records = []) {
  for (const record of records) {
    const recordId = record.id || `${collectionName}-${Date.now()}`;

    await setDoc(
      doc(db, "users", userId, collectionName, recordId),
      {
        ...record,
        id: recordId,
        importedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }
}

async function importListItems(userId, listItems = {}) {
  for (const [listId, items] of Object.entries(listItems)) {
    for (const item of items || []) {
      const itemId = item.id || `item-${Date.now()}`;

      await setDoc(
        doc(db, "users", userId, "lists", listId, "items", itemId),
        {
          ...item,
          id: itemId,
          importedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
  }
}

export async function importHubData(userId, backup) {
  if (!backup?.data) {
    throw new Error("Invalid Farmers Hub backup file.");
  }

  for (const collectionName of BACKUP_COLLECTIONS) {
    await importCollectionData(userId, collectionName, backup.data[collectionName] || []);
  }

  await importListItems(userId, backup.data.listItems || {});

  return true;
}
