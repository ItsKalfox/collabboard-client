/**
 * Safely decodes a Base64-encoded JWT payload without throwing uncaught exceptions.
 * @param {string} token - The JWT string to parse.
 * @returns {Object|null} The decoded JSON payload object, or null if invalid/malformed.
 */
export const parseJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
};

/**
 * Checks whether a JWT token is expired based on its 'exp' claim.
 * @param {string} token - The JWT string to validate.
 * @returns {boolean} True if the token is expired or malformed, false if still valid.
 */
export const isTokenExpired = (token) => {
  const payload = parseJwt(token);
  if (!payload) return true; // Malformed or invalid token is treated as expired/invalid
  if (typeof payload.exp !== 'number') return false; // If no exp claim exists, assume not expired locally
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp <= currentTime;
};

/**
 * Validates token structure and expiration claim for local offline session check.
 * @param {string} token - The JWT string to check.
 * @returns {boolean} True if token is structurally valid and not expired.
 */
export const isTokenValid = (token) => {
  return Boolean(token) && !isTokenExpired(token);
};
