/**
 * Fast Client-Side Image Compression for Mobile Cameras
 * Compresses large 5MB-15MB camera photos down to ~350KB-600KB
 * preserving readability for OCR while drastically speeding up uploads.
 */
export const compressImage = async (file, maxDimension = 1600, quality = 0.82) => {
  if (!file) return file;
  
  // Support both (file, maxDimension, quality) and (file, { maxWidth, maxHeight, maxDimension, quality })
  let maxWidth = 1600;
  let maxHeight = 1600;
  let resolvedQuality = 0.82;

  if (typeof maxDimension === 'object' && maxDimension !== null) {
    const fallbackDim = Number(maxDimension.maxDimension) || 1600;
    maxWidth = Number(maxDimension.maxWidth) || fallbackDim;
    maxHeight = Number(maxDimension.maxHeight) || fallbackDim;
    resolvedQuality = Number(maxDimension.quality) || Number(quality) || 0.82;
  } else {
    const dim = Number(maxDimension) || 1600;
    maxWidth = dim;
    maxHeight = dim;
    resolvedQuality = Number(quality) || 0.82;
  }

  // Only compress standard image files; pass through PDFs, SVG, etc.
  if (!file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  // If already under 400KB, skip re-compression to save CPU cycles
  if (file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down proportionally if larger than maxWidth / maxHeight
        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // High quality bicubic downsampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              const compressedFile = new File([blob], cleanName, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          resolvedQuality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};
