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

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function getCalendarEvents(userId) {
  const eventsRef = collection(db, "users", userId, "calendarEvents");
  const eventsQuery = query(eventsRef, orderBy("date", "asc"));
  const snapshot = await getDocs(eventsQuery);

  return snapshot.docs.map((eventDoc) => ({
    id: eventDoc.id,
    ...eventDoc.data()
  }));
}

export async function saveCalendarEvent(userId, event) {
  const eventId = event.id || makeId();
  const eventRef = doc(db, "users", userId, "calendarEvents", eventId);

  await setDoc(
    eventRef,
    {
      ...event,
      id: eventId,
      updatedAt: serverTimestamp(),
      createdAt: event.createdAt || serverTimestamp()
    },
    { merge: true }
  );

  return eventId;
}

export async function deleteCalendarEvent(userId, eventId) {
  const eventRef = doc(db, "users", userId, "calendarEvents", eventId);
  await deleteDoc(eventRef);
}
