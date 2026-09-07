// Cryptographic Password Hashing Utility using Web Crypto API (SHA-256 with Salt)

const APP_SALT = 'SI_ABSEN_SECURITY_SALT_v5.6_2026';

/**
 * Menghasilkan hash SHA-256 aman dari kata sandi plaintext
 * @param {string} plainPassword 
 * @param {string} salt 
 * @returns {Promise<string>} 64-character hex hash
 */
export async function hashPassword(plainPassword, salt = APP_SALT) {
  if (!plainPassword) return '';
  
  // Jika string sudah merupakan hash SHA-256 64-karakter hex, jangan di-hash ulang
  if (typeof plainPassword === 'string' && /^[a-f0-9]{64}$/i.test(plainPassword)) {
    return plainPassword.toLowerCase();
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainPassword + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
  } catch (err) {
    console.warn('Crypto subtle not available, fallback basic hash:', err);
    // Fallback simple hash for older environments
    let hash = 0;
    const str = plainPassword + salt;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(16);
  }
}

/**
 * Memverifikasi kata sandi input terhadap kata sandi tersimpan (baik berupa hash maupun plaintext lama)
 * @param {string} inputPassword 
 * @param {string} storedPasswordOrHash 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(inputPassword, storedPasswordOrHash) {
  if (!inputPassword || !storedPasswordOrHash) return false;

  // 1. Dukungan backward-compatibility (jika password default 'admin' atau belum di-hash)
  if (inputPassword === storedPasswordOrHash) {
    return true;
  }

  // 2. Bandingkan hash SHA-256
  const inputHash = await hashPassword(inputPassword, APP_SALT);
  return inputHash.toLowerCase() === storedPasswordOrHash.toLowerCase();
}
