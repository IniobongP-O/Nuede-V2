import {
  catalogImageBucket,
  catalogImageValidationMessage,
} from "@nuede/validation/catalog";

import { supabase, supabaseConfigurationError } from "../../../lib/supabaseClient.js";

function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigurationError);
  return supabase;
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The image could not be optimized. Choose another file."));
    }, type, quality);
  });
}

async function decodedImage(file) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("The selected file is not a readable image."));
      image.src = objectUrl;
    });
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function prepareCatalogImage(file) {
  const validationMessage = catalogImageValidationMessage(file);
  if (validationMessage) throw new Error(validationMessage);

  let image;
  try {
    image = await decodedImage(file);
    const sourceWidth = image.width || image.naturalWidth;
    const sourceHeight = image.height || image.naturalHeight;
    if (!sourceWidth || !sourceHeight) throw new Error("The selected image has invalid dimensions.");
    // Downscale only; upscaling adds bytes without recovering image detail. A
    // common WebP output keeps storefront delivery predictable across input types.
    const scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image optimization is unavailable in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await canvasBlob(canvas, "image/webp", 0.84);
  } catch (error) {
    if (error?.message?.includes("image")) throw error;
    throw new Error("The selected file is corrupted or cannot be decoded as an image.", { cause: error });
  } finally {
    image?.close?.();
  }
}

export async function uploadCatalogImage({ file, entityType, entityId }) {
  const optimized = await prepareCatalogImage(file);
  const directory = entityType === "variant" ? "variants" : "products";
  // UUID-owned paths satisfy Storage policy structure and a fresh object name
  // avoids stale public-cache content when an image is replaced.
  const path = `${directory}/${entityId}/${crypto.randomUUID()}.webp`;
  const { error } = await requireSupabase().storage
    .from(catalogImageBucket)
    // Only public catalog images: replacement always creates a new UUID URL.
    // Old URLs may remain browser-cached; private objects never use this adapter.
    .upload(path, optimized, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return path;
}

export async function removeCatalogImage(path) {
  if (!path) return;
  const { error } = await requireSupabase().storage.from(catalogImageBucket).remove([path]);
  if (error) throw error;
}

export function catalogImageUrl(path) {
  if (!path) return "";
  return requireSupabase().storage.from(catalogImageBucket).getPublicUrl(path).data.publicUrl;
}
