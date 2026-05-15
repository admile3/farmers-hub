import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";

function listsCollection(userId) {
  return collection(db, "users", userId, "lists");
}

function listItemsCollection(userId, listId) {
  return collection(db, "users", userId, "lists", listId, "items");
}

export async function getLists(userId) {
  const q = query(listsCollection(userId), orderBy("name", "asc"));
  const snapshot = await getDocs(q);

  const lists = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
      const list = { id: docSnap.id, ...docSnap.data() };
      const itemsSnapshot = await getDocs(listItemsCollection(userId, list.id));

      const items = itemsSnapshot.docs.map((itemSnap) => ({
        id: itemSnap.id,
        ...itemSnap.data()
      }));

      return {
        ...list,
        itemCount: items.length,
        checkedCount: items.filter((item) => item.checked).length
      };
    })
  );

  return lists;
}

export async function getListDetail(userId, listId) {
  const listRef = doc(db, "users", userId, "lists", listId);
  const listSnap = await getDoc(listRef);

  if (!listSnap.exists()) return null;

  const itemsSnapshot = await getDocs(listItemsCollection(userId, listId));

  const items = itemsSnapshot.docs
    .map((itemSnap) => ({
      id: itemSnap.id,
      ...itemSnap.data()
    }))
    .sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return String(a.text || "").localeCompare(String(b.text || ""), undefined, {
        sensitivity: "base"
      });
    });

  return {
    id: listSnap.id,
    ...listSnap.data(),
    items
  };
}

export async function createList(userId, list) {
  const listId = list.id || `list-${Date.now()}`;
  const listRef = doc(db, "users", userId, "lists", listId);

  await setDoc(
    listRef,
    {
      ...list,
      id: listId,
      createdAt: list.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return listId;
}

export async function deleteList(userId, listId) {
  const itemsSnapshot = await getDocs(listItemsCollection(userId, listId));

  await Promise.all(
    itemsSnapshot.docs.map((itemSnap) =>
      deleteDoc(doc(db, "users", userId, "lists", listId, "items", itemSnap.id))
    )
  );

  await deleteDoc(doc(db, "users", userId, "lists", listId));
}

export async function addListItem(userId, listId, item) {
  const itemId = item.id || `item-${Date.now()}`;
  const itemRef = doc(db, "users", userId, "lists", listId, "items", itemId);

  await setDoc(
    itemRef,
    {
      ...item,
      id: itemId,
      checked: Boolean(item.checked),
      createdAt: item.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return itemId;
}

export async function updateListItem(userId, listId, itemId, updates) {
  const itemRef = doc(db, "users", userId, "lists", listId, "items", itemId);

  await setDoc(
    itemRef,
    {
      ...updates,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function deleteListItem(userId, listId, itemId) {
  await deleteDoc(doc(db, "users", userId, "lists", listId, "items", itemId));
}
