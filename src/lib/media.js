const maxSourceBytes = 10 * 1024 * 1024;
const maxDimension = 1600;
const webpQuality = 0.82;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(image.src);
      resolve(image);
    };
    image.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    image.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo convertir la imagen.'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo preparar la vista local.'));
    reader.readAsDataURL(blob);
  });
}

export function sanitizeStorageSegment(value) {
  return (value || 'general')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'general';
}

export async function convertImageFileToWebp(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen valido.');
  }

  if (file.size > maxSourceBytes) {
    throw new Error('La imagen supera 10 MB. Reduce el archivo antes de cargarlo.');
  }

  const image = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, 'image/webp', webpQuality);
  const baseName = sanitizeStorageSegment(file.name.replace(/\.[^.]+$/, ''));
  const webpFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' });
  const dataUrl = await blobToDataUrl(webpFile);

  return {
    file: webpFile,
    dataUrl,
    width,
    height,
    originalBytes: file.size,
    webpBytes: webpFile.size,
  };
}
