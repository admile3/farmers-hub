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

function flowersCollection(userId) {
  return collection(db, "users", userId, "flowerStudioFlowers");
}

function containersCollection(userId) {
  return collection(db, "users", userId, "flowerStudioContainers");
}

function arrangementsCollection(userId) {
  return collection(db, "users", userId, "flowerStudioArrangements");
}

function productionCollection(userId) {
  return collection(db, "users", userId, "flowerStudioProduction");
}

function cleanNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? number : "";
}

export async function getFlowerItems(userId) {
  if (!userId) return [];

  const q = query(flowersCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function createFlowerItem(userId, flower) {
  const ref = await addDoc(flowersCollection(userId), {
    name: flower.name || "",
    category: flower.category || "Focal",
    color: flower.color || "",
    bloomSeason: flower.bloomSeason || "",
    useType: flower.useType || "",
    difficulty: flower.difficulty || "",
    stemCost: cleanNumber(flower.stemCost),
    inventoryCount: cleanNumber(flower.inventoryCount),
    notes: flower.notes || "",
    source: flower.source || "Manual",
    zone: flower.zone || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function updateFlowerItem(userId, flowerId, flower) {
  await updateDoc(doc(db, "users", userId, "flowerStudioFlowers", flowerId), {
    name: flower.name || "",
    category: flower.category || "Focal",
    color: flower.color || "",
    bloomSeason: flower.bloomSeason || "",
    useType: flower.useType || "",
    difficulty: flower.difficulty || "",
    stemCost: cleanNumber(flower.stemCost),
    inventoryCount: cleanNumber(flower.inventoryCount),
    notes: flower.notes || "",
    source: flower.source || "Manual",
    zone: flower.zone || "",
    updatedAt: serverTimestamp()
  });
}

export async function deleteFlowerItem(userId, flowerId) {
  await deleteDoc(doc(db, "users", userId, "flowerStudioFlowers", flowerId));
}

export async function getFlowerContainers(userId) {
  if (!userId) return [];

  const q = query(containersCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function createFlowerContainer(userId, container) {
  const ref = await addDoc(containersCollection(userId), {
    name: container.name || "",
    type: container.type || "Other",
    unitCost: cleanNumber(container.unitCost),
    inventoryCount: cleanNumber(container.inventoryCount),
    notes: container.notes || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function updateFlowerContainer(userId, containerId, container) {
  await updateDoc(doc(db, "users", userId, "flowerStudioContainers", containerId), {
    name: container.name || "",
    type: container.type || "Other",
    unitCost: cleanNumber(container.unitCost),
    inventoryCount: cleanNumber(container.inventoryCount),
    notes: container.notes || "",
    updatedAt: serverTimestamp()
  });
}

export async function deleteFlowerContainer(userId, containerId) {
  await deleteDoc(doc(db, "users", userId, "flowerStudioContainers", containerId));
}

export async function getFlowerArrangements(userId) {
  if (!userId) return [];

  const q = query(arrangementsCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function createFlowerArrangement(userId, arrangement) {
  const ref = await addDoc(arrangementsCollection(userId), {
    ...arrangement,
    containerId: arrangement.containerId || "",
    containerName: arrangement.containerName || "",
    containerCost: cleanNumber(arrangement.containerCost),
    packagingCost: cleanNumber(arrangement.packagingCost),
    retailPrice: cleanNumber(arrangement.retailPrice),
    wholesalePrice: cleanNumber(arrangement.wholesalePrice),
    estimatedCost: cleanNumber(arrangement.estimatedCost),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function updateFlowerArrangement(userId, arrangementId, arrangement) {
  await updateDoc(doc(db, "users", userId, "flowerStudioArrangements", arrangementId), {
    ...arrangement,
    containerId: arrangement.containerId || "",
    containerName: arrangement.containerName || "",
    containerCost: cleanNumber(arrangement.containerCost),
    packagingCost: cleanNumber(arrangement.packagingCost),
    retailPrice: cleanNumber(arrangement.retailPrice),
    wholesalePrice: cleanNumber(arrangement.wholesalePrice),
    estimatedCost: cleanNumber(arrangement.estimatedCost),
    updatedAt: serverTimestamp()
  });
}

export async function deleteFlowerArrangement(userId, arrangementId) {
  await deleteDoc(doc(db, "users", userId, "flowerStudioArrangements", arrangementId));
}

export async function getFlowerProductionLogs(userId) {
  if (!userId) return [];

  const q = query(productionCollection(userId), orderBy("productionDate", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

export async function createFlowerProductionLog(userId, log) {
  const ref = await addDoc(productionCollection(userId), {
    ...log,
    quantity: cleanNumber(log.quantity),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return ref.id;
}

export async function updateFlowerProductionLog(userId, logId, log) {
  await updateDoc(doc(db, "users", userId, "flowerStudioProduction", logId), {
    ...log,
    quantity: cleanNumber(log.quantity),
    updatedAt: serverTimestamp()
  });
}

export async function deleteFlowerProductionLog(userId, logId) {
  await deleteDoc(doc(db, "users", userId, "flowerStudioProduction", logId));
}
