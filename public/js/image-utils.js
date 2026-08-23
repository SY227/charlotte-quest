const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.78;
const MAX_FILES = 8;

export async function prepareImageFiles(fileList, onProgress = () => {}) {
  const files = [...fileList].filter((file) => file.type.startsWith("image/")).slice(0, MAX_FILES);
  const results = [];
  for (let index = 0; index < files.length; index += 1) {
    onProgress({ current: index + 1, total: files.length, name: files[index].name });
    results.push(await resizeImage(files[index]));
  }
  return results;
}

async function resizeImage(file) {
  const source = await loadImageSource(file);
  const dimensions = fitWithin(source.width, source.height, MAX_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("This browser could not prepare the image.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source.image, 0, 0, dimensions.width, dimensions.height);

  const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
  const dataUrl = await blobToDataUrl(blob);
  source.cleanup?.();

  return {
    id: crypto.randomUUID?.() || `image-${Date.now()}-${Math.random()}`,
    name: file.name || "Homework photo",
    mimeType: "image/jpeg",
    base64: dataUrl.split(",")[1],
    previewUrl: dataUrl,
    originalSize: file.size,
    compressedSize: blob.size,
    width: dimensions.width,
    height: dimensions.height
  };
}

async function loadImageSource(file) {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        image: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close()
      };
    } catch {
      // Safari and some HEIC files may need the HTMLImageElement path.
    }
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url)
  };
}

function fitWithin(width, height, maxDimension) {
  if (Math.max(width, height) <= maxDimension) return { width, height };
  const scale = maxDimension / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("This image could not be compressed."));
    }, type, quality);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("This image could not be read."));
    reader.readAsDataURL(blob);
  });
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
