// Access token chỉ giữ trong bộ nhớ (không lưu localStorage để tránh bị đánh cắp qua XSS).
// F5 sẽ mất token, axios tự lấy lại bằng refresh token nằm trong cookie HttpOnly.
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};

// Thông tin hiển thị của user (không chứa token) vẫn lưu localStorage để giữ trạng thái đăng nhập khi F5
export const USER_STORAGE_KEY = "user";

type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();

// AuthContext đăng ký để đưa user về trạng thái chưa đăng nhập khi refresh thất bại
export const onSessionExpired = (listener: Listener) => {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
};

export const notifySessionExpired = () => {
  sessionExpiredListeners.forEach((listener) => listener());
};
