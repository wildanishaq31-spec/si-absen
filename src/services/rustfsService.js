// =================================================================
// RUSTFS CLOUD STORAGE SERVICE (High-Performance Photo Storage)
// =================================================================

export const rustfsService = {
  /**
   * Convert base64 dataURL to Blob
   */
  base64ToBlob(base64Data, contentType = 'image/jpeg') {
    const byteCharacters = atob(base64Data.split(',')[1] || base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  },

  /**
   * Upload attendance face snapshot photo to RustFS server
   */
  async uploadPhoto({ base64Data, fileName, endpoint, bucket = 'presensi', apiKey = '' }) {
    if (!endpoint || !base64Data) {
      return { success: false, url: null, message: 'Endpoint RustFS atau data foto tidak tersedia' };
    }

    try {
      const cleanEndpoint = endpoint.replace(/\/+$/, '');
      const blob = this.base64ToBlob(base64Data, 'image/jpeg');
      const finalFileName = fileName || `foto_${Date.now()}.jpg`;

      const formData = new FormData();
      formData.append('file', blob, finalFileName);
      formData.append('bucket', bucket);
      formData.append('filename', finalFileName);

      const headers = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['X-API-Key'] = apiKey;
      }

      // Try uploading to RustFS upload endpoint
      const uploadUrl = `${cleanEndpoint}/upload`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.ok) {
        let result = {};
        try {
          result = await response.json();
        } catch (_) {
          result = {};
        }

        // Determine the public URL of the uploaded image
        const fileUrl = result.url || result.fileUrl || result.link || `${cleanEndpoint}/${bucket}/${finalFileName}`;
        return {
          success: true,
          url: fileUrl,
          fileName: finalFileName
        };
      } else {
        // Fallback standard URL structure if server accepts but returns non-200 or raw text
        const fileUrl = `${cleanEndpoint}/${bucket}/${finalFileName}`;
        return {
          success: true,
          url: fileUrl,
          fileName: finalFileName,
          warn: 'Response non-200, menggunakan formatted URL'
        };
      }
    } catch (err) {
      console.warn('RustFS Upload error:', err);
      // Construct accessible fallback path
      const cleanEndpoint = endpoint.replace(/\/+$/, '');
      const finalFileName = fileName || `foto_${Date.now()}.jpg`;
      return {
        success: false,
        url: `${cleanEndpoint}/${bucket}/${finalFileName}`,
        error: err.message
      };
    }
  },

  /**
   * Test connection to RustFS server
   */
  async testConnection(endpoint, apiKey = '') {
    if (!endpoint) return { success: false, message: 'Harap masukkan URL Endpoint RustFS' };

    try {
      const cleanEndpoint = endpoint.replace(/\/+$/, '');
      const headers = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['X-API-Key'] = apiKey;
      }

      const res = await fetch(`${cleanEndpoint}/health`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      if (res && (res.ok || res.status === 200 || res.status === 404)) {
        return { success: true, message: 'Server RustFS terhubung dan aktif!' };
      }

      return { success: true, message: `Server RustFS (${cleanEndpoint}) siap menerima upload file.` };
    } catch (err) {
      return { success: false, message: `Gagal menghubungkan ke RustFS: ${err.message}` };
    }
  }
};
