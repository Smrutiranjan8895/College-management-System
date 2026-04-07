import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();

const api = axios.create({
  baseURL: configuredApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getApiErrorMessage(error, fallbackMessage = 'Request failed') {
  const status = error?.response?.status;
  const payload = error?.response?.data;

  const serverMessage =
    payload?.error ||
    payload?.message ||
    payload?.details ||
    null;

  if (serverMessage) {
    return serverMessage;
  }

  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  return error?.message || fallbackMessage;
}

api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    const accessToken = session.tokens?.accessToken?.toString();
    const token = idToken || accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching auth session:', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const payload = error?.response?.data;

    console.error('API request failed:', {
      url: error?.config?.url,
      method: error?.config?.method,
      status,
      payload,
      message: error?.message,
    });

    error.userMessage = getApiErrorMessage(error);

    if (error.response?.status === 401) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

if (!configuredApiUrl) {
  console.warn('VITE_API_URL is not set. API calls will use the current origin and may fail if no proxy is configured.');
}

export default api;
