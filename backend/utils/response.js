// Standard HTTP response builder for API Gateway Lambda proxy integration
// Includes CORS headers for cross-origin requests

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};

/**
 * Success response helper
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {object} body - Response body object
 * @returns {object} API Gateway proxy response
 */
export const ok = (statusCode, body) => {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
  };
};

/**
 * Error response helper
 * @param {number} statusCode - HTTP status code (400, 403, 404, 500, etc.)
 * @param {string} message - Error message
 * @returns {object} API Gateway proxy response
 */
export const err = (statusCode, message) => {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message })
  };
};
