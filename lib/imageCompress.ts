/**
 * Downscale large phone photos in the browser before upload.
 * Skips PDFs and small images. Falls back to the original file on any error.
 */
export async function compressImageIfLarge(
  file: File,
  maxDim = 2000,
  quality = 0.85
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (file.type === "application/pdf") return file;
  if (!file.type.startsWith("image/")) return file;

  const isAcceptedFormat = /^image\/(jpeg|png|webp|gif)$/.test(file.type);
  // Always re-encode HEIC/HEIF and other formats Anthropic vision rejects.
  // Otherwise, skip the work for already-small accepted formats.
  if (isAcceptedFormat && file.size < 1.5 * 1024 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 4 * 1024 * 1024 && isAcceptedFormat) return file;

    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
