import axios from 'axios';
import {
  tokenStore,
  notifySessionExpired,
  USER_STORAGE_KEY,
} from '@/config/tokenStore';

const BASE_URL = import.meta.env.VITE_BASE_API_URL;

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const hasSession = () => localStorage.getItem(USER_STORAGE_KEY) !== null;

let refreshPromise: Promise<string> | null = null;

// Lấy access token mới bằng refresh token trong cookie HttpOnly.
// Gộp các lần gọi đồng thời thành 1 request duy nhất.
export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/auth/refresh`, null, { withCredentials: true })
      .then((res) => {
        const token: string | undefined = res.data?.data?.accessToken;
        if (!token) throw new Error('Refresh failed');
        tokenStore.set(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Chỉ coi là hết phiên khi server từ chối refresh token, lỗi mạng thì giữ nguyên phiên
const isRefreshRejected = (err: unknown) =>
  axios.isAxiosError(err) && err.response?.status === 401;

const endSession = () => {
  tokenStore.clear();
  localStorage.removeItem(USER_STORAGE_KEY);
  notifySessionExpired();
};

instance.interceptors.request.use(
  async (config) => {
    // Sau khi F5 token trong bộ nhớ đã mất: còn phiên thì lấy token mới trước khi gửi request
    if (!tokenStore.get() && hasSession()) {
      try {
        await refreshAccessToken();
      } catch (err) {
        if (isRefreshRejected(err)) endSession();
      }
    }

    const token = tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Access token hết hạn: refresh một lần rồi gửi lại request
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Request khác đã refresh xong trong lúc request này chạy: dùng luôn token mới, không rotate thêm
        const current = tokenStore.get();
        const token =
          current && originalRequest.headers.Authorization !== `Bearer ${current}`
            ? current
            : await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return instance(originalRequest);
      } catch (err) {
        if (isRefreshRejected(err)) {
          endSession();
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
