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

  const extension = file.name.split(".").pop();

  const storageRef = ref(
    storage,
    `users/${userId}/products/${productId}.${extension}`
  );

  await uploadBytes(storageRef, file);

  const downloadUrl = await getDownloadURL(storageRef);

  return {
    imageUrl: downloadUrl,
    imagePath: storageRef.fullPath
  };
}

export async function deleteProductImage(imagePath) {
  if (!imagePath) return;

  try {
    const storageRef = ref(storage, imagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Failed to delete image:", error);
  }
}
