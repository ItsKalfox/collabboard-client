/**
 * userService.js
 * Service functions for user account management APIs.
 * All endpoints require authentication (Bearer token in localStorage).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = (isJson = true) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Upload a profile picture to Cloudinary via the backend.
 * @param {File} imageFile - Image file (JPEG, PNG, GIF, WebP). Max 10MB.
 * @returns {Promise<Object>} - { avatarUrl, user }
 */
export const uploadAvatar = async (imageFile) => {
  const formData = new FormData();
  formData.append('avatar', imageFile);

  const response = await fetch(`${API_URL}/users/avatar`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to upload avatar');
  return data.data;
};

/**
 * Remove the authenticated user's profile picture.
 * @returns {Promise<Object>} - Updated user object
 */
export const removeAvatar = async () => {
  const response = await fetch(`${API_URL}/users/avatar`, {
    method: 'DELETE',
    headers: getAuthHeaders(false),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to remove avatar');
  return data.data.user;
};

/**
 * Update the authenticated user's first and last name.
 * @param {string} firstName
 * @param {string} lastName
 * @returns {Promise<Object>} - Updated user object
 */
export const updateProfile = async (firstName, lastName) => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ firstName, lastName }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update profile');
  return data.data.user;
};

/**
 * Change the authenticated user's email address.
 * Requires current password for verification.
 * @param {string} email - New email address
 * @param {string} currentPassword - Current account password
 * @returns {Promise<Object>} - Updated user object
 */
export const updateEmail = async (email, currentPassword) => {
  const response = await fetch(`${API_URL}/auth/email`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, currentPassword }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update email');
  return data.data.user;
};

/**
 * Change the authenticated user's password.
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password (min 6 chars)
 * @param {string} confirmNewPassword - Must match newPassword
 * @returns {Promise<void>}
 */
export const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
  const response = await fetch(`${API_URL}/auth/password`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to change password');
  return data;
};
