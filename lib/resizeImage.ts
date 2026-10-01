// Runs in the browser: shrink a photo to max 1024px and re-encode as JPEG,
// so uploads stay small and cheap. Returns a data URL. Nothing is stored.
import { MAX_IMAGE_PX } from "./config";

export async function resizeImage(file: File, max = MAX_IMAGE_PX): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
