/**
 * Helper utilities for compressing media assets to stay under Firestore document size limits (1MB).
 */

export async function compressImage(
  input: string | File | Blob,
  maxDimension = 1024,
  maxBase64Length = 550000
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    const processImage = () => {
      let width = img.width || 800;
      let height = img.height || 600;

      // Scale down dimensions if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(typeof input === 'string' ? input : '');
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.75;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      // Iteratively reduce quality if still over limit
      while (dataUrl.length > maxBase64Length && quality > 0.15) {
        quality -= 0.15;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      // If still too large, downscale canvas resolution
      if (dataUrl.length > maxBase64Length) {
        const shrinkCanvas = document.createElement('canvas');
        shrinkCanvas.width = Math.floor(width * 0.6);
        shrinkCanvas.height = Math.floor(height * 0.6);
        const shrinkCtx = shrinkCanvas.getContext('2d');
        if (shrinkCtx) {
          shrinkCtx.drawImage(img, 0, 0, shrinkCanvas.width, shrinkCanvas.height);
          dataUrl = shrinkCanvas.toDataURL('image/jpeg', 0.5);
        }
      }

      resolve(dataUrl);
    };

    img.onload = processImage;
    img.onerror = () => {
      resolve(typeof input === 'string' ? input : '');
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(input);
    }
  });
}
