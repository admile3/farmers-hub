import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes
} from "firebase/storage";
import { storage } from "../firebase";

export async function uploadProductImage(userId, productId, file) {
  if (!userId || !productId || !file) {
    throw new Error("Missing required upload parameters.");
  }

  const safeFileName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-");

  const storageRef = ref(
    storage,
    `users/${userId}/products/${productId}/${Date.now()}-${safeFileName}`
  );

  await uploadBytes(storageRef, file);

  const downloadUrl = await getDownloadURL(storageRef);

  return {
    imageUrl: downloadUrl,
    imagePath: storageRef.fullPath
  };
}

export async function deleteStorageFile(filePath) {
  if (!filePath) return;

  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Failed to delete storage file:", error);
  }
}

export async function deleteProductImage(imagePath) {
  return deleteStorageFile(imagePath);
}
