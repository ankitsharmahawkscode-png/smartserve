import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL, withCredentials: true });
const raw = axios.create({ baseURL, withCredentials: true }); // no interceptors, used for refresh

let accessToken = null;
let onAuthFailure = () => {};
export const setAccessToken = (t) => { accessToken = t; };
export const setAuthFailureHandler = (fn) => { onAuthFailure = fn; };

// Shared in-flight promise: simultaneous callers (React StrictMode, parallel 401s)
// reuse ONE refresh request. Refresh tokens are single-use on the server.
let refreshPromise = null;
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = raw
      .post('/auth/refresh')
      .then((r) => { setAccessToken(r.data.data.accessToken); return r.data.data; })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        await refreshSession();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        setAccessToken(null);
        onAuthFailure();
      }
    }
    return Promise.reject(error);
  }
);

export const apiMessage = (err) =>
  err.response?.data?.message || (err.request ? 'Cannot reach the server. Check your connection.' : 'Something went wrong. Please try again.');

export default api;