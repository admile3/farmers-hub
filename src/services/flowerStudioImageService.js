import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";

function safeFileName(fileName = "flower-studio-image") {
  return fileName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/-+/g, "-");
}

export async function uploadFlowerStudioImage({ userId, file, folder }) {
  if (!userId) throw new Error("Missing user ID.");
  if (!file) throw new Error("Missing image file.");

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WebP image.");
  }

  const maxSize = 8 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Image must be smaller than 8 MB.");
  }

  const cleanName = safeFileName(file.name);
  const path = `users/${userId}/flower-studio/${folder}/${Date.now()}-${cleanName}`;
  const imageRef = ref(storage, path);

  await uploadBytes(imageRef, file, {
    contentType: file.type,
  });

  return getDownloadURL(imageRef);
}
