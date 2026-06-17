import {
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  collection
} from "firebase/firestore";

import { db } from "../firebase";

function calendarEventsCollection(userId) {
  return collection(db, "users", userId, "calendarEvents");
}

function makeModuleEventId({ sourceModuleKey, sourceRecordId, sourceEventType }) {
  return `${sourceModuleKey}-${sourceRecordId}-${sourceEventType}`;
}

export async function upsertModuleCalendarEvent(userId, event) {
  if (!userId) {
    throw new Error("A user ID is required to save a module calendar event.");
  }

  if (!event?.sourceModuleKey || !event?.sourceRecordId || !event?.sourceEventType) {
    throw new Error(
      "A module calendar event requires sourceModuleKey, sourceRecordId, and sourceEventType."
    );
  }

  if (!event?.date) {
    await deleteModuleCalendarEvent(userId, {
      sourceModuleKey: event.sourceModuleKey,
      sourceRecordId: event.sourceRecordId,
      sourceEventType: event.sourceEventType
    });

    return null;
  }

  const eventId = makeModuleEventId(event);
  const eventRef = doc(db, "users", userId, "calendarEvents", eventId);

  const cleanedEvent = {
    id: eventId,
    title: event.title || "Calendar Event",
    type: event.type || "Reminder",
    date: event.date,
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    location: event.location || "",
    notes: event.notes || "",
    source: event.sourceModuleKey,
    sourceModule: event.sourceModule || event.sourceModuleKey,
    sourceModuleKey: event.sourceModuleKey,
    sourceRecordId: event.sourceRecordId,
    sourceEventType: event.sourceEventType,
    sourcePath: event.sourcePath || "",
    accent: event.accent || "calendar",
    details: event.details || {},
    isModuleGenerated: true,
    updatedAt: serverTimestamp()
  };

  await setDoc(
    eventRef,
    {
      ...cleanedEvent,
      createdAt: event.createdAt || serverTimestamp()
    },
    { merge: true }
  );

  return eventId;
}

export async function deleteModuleCalendarEvent(userId, event) {
  if (!userId) {
    throw new Error("A user ID is required to delete a module calendar event.");
  }

  if (!event?.sourceModuleKey || !event?.sourceRecordId || !event?.sourceEventType) {
    throw new Error(
      "A module calendar event requires sourceModuleKey, sourceRecordId, and sourceEventType."
    );
  }

  const eventId = makeModuleEventId(event);
  const eventRef = doc(db, "users", userId, "calendarEvents", eventId);

  await deleteDoc(eventRef);
}

export async function deleteModuleCalendarEventsForRecord(userId, {
  sourceModuleKey,
  sourceRecordId
}) {
  if (!userId || !sourceModuleKey || !sourceRecordId) return;

  const eventsQuery = query(
    calendarEventsCollection(userId),
    where("sourceModuleKey", "==", sourceModuleKey),
    where("sourceRecordId", "==", sourceRecordId)
  );

  const snapshot = await getDocs(eventsQuery);

  await Promise.all(snapshot.docs.map((eventDoc) => deleteDoc(eventDoc.ref)));
}

export async function syncModuleCalendarEvents(userId, events = []) {
  if (!userId) {
    throw new Error("A user ID is required to sync module calendar events.");
  }

  const validEvents = Array.isArray(events) ? events : [];

  const savedIds = await Promise.all(
    validEvents.map((event) => upsertModuleCalendarEvent(userId, event))
  );

  return savedIds.filter(Boolean);
}
