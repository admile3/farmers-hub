import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanRecord(record, prefix) {
  const now = new Date().toISOString();

  return {
    ...record,
    id: record.id || makeId(prefix),
    updatedAt: now,
    createdAt: record.createdAt || now
  };
}

export async function getPlantingTemplates(uid) {
  if (!uid) return [];

  const templatesRef = collection(
    db,
    "users",
    uid,
    "plantingTemplates"
  );

  const snapshot = await getDocs(
    query(templatesRef, orderBy("updatedAt", "desc"))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function savePlantingTemplate(uid, template) {
  if (!uid) {
    throw new Error(
      "User ID is required to save a crop template."
    );
  }

  const clean = cleanRecord(template, "template");

  const templateRef = doc(
    db,
    "users",
    uid,
    "plantingTemplates",
    clean.id
  );

  await setDoc(templateRef, clean, {
    merge: true
  });

  return clean.id;
}

export async function deletePlantingTemplate(
  uid,
  templateId
) {
  if (!uid || !templateId) return;

  const templateRef = doc(
    db,
    "users",
    uid,
    "plantingTemplates",
    templateId
  );

  await deleteDoc(templateRef);
}

export async function getPlantingBatches(uid) {
  if (!uid) return [];

  const batchesRef = collection(
    db,
    "users",
    uid,
    "plantingBatches"
  );

  const snapshot = await getDocs(
    query(batchesRef, orderBy("plantingDate", "asc"))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function savePlantingBatch(uid, batch) {
  if (!uid) {
    throw new Error(
      "User ID is required to save a planting batch."
    );
  }

  const clean = cleanRecord(batch, "batch");

  const batchRef = doc(
    db,
    "users",
    uid,
    "plantingBatches",
    clean.id
  );

  await setDoc(batchRef, clean, {
    merge: true
  });

  return clean.id;
}

export async function deletePlantingBatch(
  uid,
  batchId
) {
  if (!uid || !batchId) return;

  const batchRef = doc(
    db,
    "users",
    uid,
    "plantingBatches",
    batchId
  );

  await deleteDoc(batchRef);
}
