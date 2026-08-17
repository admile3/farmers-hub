import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";

import { db } from "../firebase";

function taskCollection(userId) {
  return collection(db, "users", userId, "dailyOperationTasks");
}

function stationCollection(userId) {
  return collection(db, "users", userId, "dailyOperationStations");
}

function logCollection(userId) {
  return collection(db, "users", userId, "dailyOperationLogs");
}

function randomToken(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }

  return value;
}

function cleanTask(task = {}) {
  return {
    name: task.name || "",
    description: task.description || "",
    stationId: task.stationId || "",
    stationName: task.stationName || "",
    category: task.category || "General",
    scheduleType: task.scheduleType || "daily",
    daysOfWeek: Array.isArray(task.daysOfWeek) ? task.daysOfWeek : [],
    availableTime: task.availableTime || "",
    dueTime: task.dueTime || "",
    completionType: task.completionType || "simple",
    responseType: task.responseType || "none",
    unit: task.unit || "",
    allowMultipleCompletions: Boolean(task.allowMultipleCompletions),
    barcode: task.barcode || `FH-TASK-${randomToken()}`,
    active: task.active !== false,
    sortOrder: Number(task.sortOrder) || 0,
    updatedAt: serverTimestamp()
  };
}

function cleanStation(station = {}) {
  return {
    name: station.name || "",
    description: station.description || "",
    category: station.category || "General",
    barcode: station.barcode || `FH-STATION-${randomToken()}`,
    active: station.active !== false,
    sortOrder: Number(station.sortOrder) || 0,
    updatedAt: serverTimestamp()
  };
}

export async function getDailyOperationTasks(userId) {
  if (!userId) return [];

  const snapshot = await getDocs(query(taskCollection(userId), orderBy("sortOrder", "asc")));
  return snapshot.docs.map((taskDoc) => ({ id: taskDoc.id, ...taskDoc.data() }));
}

export async function saveDailyOperationTask(userId, task) {
  if (!userId) throw new Error("A user ID is required to save a daily operations task.");

  const clean = cleanTask(task);

  if (task.id) {
    await setDoc(
      doc(db, "users", userId, "dailyOperationTasks", task.id),
      { ...clean, createdAt: task.createdAt || null },
      { merge: true }
    );
    return task.id;
  }

  const ref = await addDoc(taskCollection(userId), {
    ...clean,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function deleteDailyOperationTask(userId, taskId) {
  if (!userId || !taskId) throw new Error("A user ID and task ID are required.");
  await deleteDoc(doc(db, "users", userId, "dailyOperationTasks", taskId));
}

export async function getDailyOperationStations(userId) {
  if (!userId) return [];

  const snapshot = await getDocs(query(stationCollection(userId), orderBy("sortOrder", "asc")));
  return snapshot.docs.map((stationDoc) => ({ id: stationDoc.id, ...stationDoc.data() }));
}

export async function saveDailyOperationStation(userId, station) {
  if (!userId) throw new Error("A user ID is required to save a station.");

  const clean = cleanStation(station);

  if (station.id) {
    await setDoc(
      doc(db, "users", userId, "dailyOperationStations", station.id),
      { ...clean, createdAt: station.createdAt || null },
      { merge: true }
    );
    return station.id;
  }

  const ref = await addDoc(stationCollection(userId), {
    ...clean,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function deleteDailyOperationStation(userId, stationId) {
  if (!userId || !stationId) throw new Error("A user ID and station ID are required.");
  await deleteDoc(doc(db, "users", userId, "dailyOperationStations", stationId));
}

export async function getDailyOperationLogs(userId, dateKey = "") {
  if (!userId) return [];

  const logsQuery = dateKey
    ? query(logCollection(userId), where("dateKey", "==", dateKey))
    : query(logCollection(userId), orderBy("completedAt", "desc"));

  const snapshot = await getDocs(logsQuery);
  return snapshot.docs.map((logDoc) => ({ id: logDoc.id, ...logDoc.data() }));
}

export async function completeDailyOperationTask(userId, task, details = {}) {
  if (!userId || !task?.id) throw new Error("A user ID and task are required.");

  const now = new Date();
  const localDateKey = details.dateKey || [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  const ref = await addDoc(logCollection(userId), {
    taskId: task.id,
    taskName: task.name || "",
    stationId: task.stationId || "",
    stationName: task.stationName || "",
    dateKey: localDateKey,
    value: details.value ?? "",
    unit: task.unit || details.unit || "",
    status: details.status || "Complete",
    notes: details.notes || "",
    completionMethod: details.completionMethod || "manual",
    completedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  });

  return ref.id;
}

export async function deleteDailyOperationLog(userId, logId) {
  if (!userId || !logId) throw new Error("A user ID and log ID are required.");
  await deleteDoc(doc(db, "users", userId, "dailyOperationLogs", logId));
}
