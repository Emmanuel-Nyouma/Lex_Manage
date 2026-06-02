// src/config/api.config.js
export const API_CONFIG = {
  // Get base URL (without /api/v1)
  BASE_URL: (() => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    // Remove trailing /api/v1 if present
    return url.replace(/\/api\/v1\/?$/, '');
  })(),

  // Full API URL with /api/v1
  get API_URL() {
    return `${this.BASE_URL}/api/v1`;
  },

  // WebSocket URL
  get WS_URL() {
    return import.meta.env.VITE_WS_URL || this.BASE_URL;
  },

  // Feature flags
  ENABLE_AI: import.meta.env.VITE_ENABLE_AI !== 'false',
  SECURE_AUTH: import.meta.env.VITE_SECURE_AUTH !== 'false',
};
