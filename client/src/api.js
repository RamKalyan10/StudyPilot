/**
 * @file api.js
 * @description Centralized HTTP Client & JWT Authentication Helpers.
 * Handles authentication headers, token storage in localStorage, and unified API error handling.
 */

/**
 * Base URL for StudyPilot Backend API endpoints.
 * Configured via Vite environment variable VITE_API_URL or defaults to localhost:5000/api.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Retrieves the stored JWT authentication token from localStorage.
 *
 * @returns {string|null} JWT token or null if not authenticated
 */
export function getToken() {
  return localStorage.getItem('studypilot_token');
}

/**
 * Updates or removes the JWT token in localStorage.
 *
 * @param {string|null} token - JWT token string or falsy value to clear token
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem('studypilot_token', token);
  } else {
    localStorage.removeItem('studypilot_token');
  }
}

/**
 * Core fetch wrapper for StudyPilot API requests.
 * Automatically injects the Bearer authorization header if a valid token is present.
 *
 * @param {string} path - Relative API endpoint path (e.g. '/tasks', '/schedules/generate')
 * @param {RequestInit} [options={}] - Standard Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} Parsed JSON response payload
 * @throws {Error} Throws an error with server error message if response is not ok
 */
export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({
    message: 'Unexpected server response or network error'
  }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}
