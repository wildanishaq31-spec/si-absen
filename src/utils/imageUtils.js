/**
 * Image processing utilities for SI-ABSEN
 * Resizes, center-crops to square, and compresses profile photos for efficient cloud sync
 */

export function processProfileImage(file, targetSize = 320, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format file gambar tidak valid'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          // Center crop calculation
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates Google Drive destination metadata string / path
 * Hierarchy: [Folder Utama] -> Profil Pegawai -> {NAMA}_{NIP}.jpg
 */
export function getProfileDrivePath(user, mainFolderUrl = '') {
  const cleanName = (user?.name || 'Pegawai').toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const cleanNip = (user?.nip || '000000').replace(/[^0-9]/g, '');
  const fileName = `${cleanName}_${cleanNip}.jpg`;
  const folderPath = `Profil Pegawai/${cleanName}_${cleanNip}`;
  
  return {
    fileName,
    folderPath,
    fullHierarchy: mainFolderUrl ? `${mainFolderUrl} > ${folderPath} > ${fileName}` : folderPath
  };
}
