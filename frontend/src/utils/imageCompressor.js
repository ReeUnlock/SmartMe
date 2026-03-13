const MAX_DIMENSION = 1920;
const QUALITY = 0.85;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Compress an image file before upload.
 * Resizes if too large, converts to JPEG, reduces quality.
 * Returns a new File object.
 *
 * Always converts non-JPEG to JPEG (handles HEIC/WebP/PNG via browser decode).
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    // If already small enough and is JPEG, skip compression
    if (file.size <= MAX_FILE_SIZE && file.type === "image/jpeg") {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Reject images that are too small to be a receipt
      if (width < 100 || height < 100) {
        reject(new Error("Obraz jest za mały. Wybierz wyraźniejsze zdjęcie paragonu."));
        return;
      }

      // Resize if needed
      if (Math.max(width, height) > MAX_DIMENSION) {
        const ratio = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      let canvas;
      try {
        canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Nie udało się przetworzyć obrazu (brak canvas)."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
      } catch (e) {
        reject(new Error("Nie udało się przetworzyć obrazu."));
        return;
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Nie udało się skompresować obrazu. Spróbuj format JPEG."));
            return;
          }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" }
          );
          resolve(compressed);
        },
        "image/jpeg",
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nie udało się wczytać obrazu. Spróbuj inny plik lub format JPEG/PNG."));
    };

    img.src = url;
  });
}
