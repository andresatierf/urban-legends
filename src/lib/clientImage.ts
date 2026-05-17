// Client-side image processing: canvas downscale + JPEG re-encode.
// Drops EXIF metadata as a side effect of the canvas round-trip; no
// separate EXIF-strip pass is needed.
// HEIC/HEIF: decoded via heic2any (dynamically imported to keep the default
// bundle lean), then handed to the same canvas pipeline as every other format.
// Library used for JPEG/PNG/WebP/GIF: native canvas API.
// Library used for HEIC/HEIF: heic2any@0.0.4 (https://github.com/alexcorvi/heic2any).

export interface ProcessOptions {
  maxDim?: number;
  quality?: number;
}

export async function processForUpload(
  file: File,
  opts: ProcessOptions = {},
): Promise<Blob> {
  const { maxDim = 2000, quality = 0.85 } = opts;

  if (file.type === "image/heic" || file.type === "image/heif") {
    const { default: heic2any } = await import("heic2any");
    const decoded = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 1,
    });
    const decodedBlob = Array.isArray(decoded) ? decoded[0] : decoded;
    const decodedFile = new File([decodedBlob], file.name, {
      type: "image/jpeg",
    });
    return processForUpload(decodedFile, opts);
  }

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) {
        reject(new Error("Could not get 2D canvas context"));
        return;
      }
      ctx2d.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob returned null"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image"));
    };

    img.src = objectUrl;
  });
}
