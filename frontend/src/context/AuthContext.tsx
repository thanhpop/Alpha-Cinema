import React, { createContext, useContext, useEffect, useState } from "react";
import {
  tokenStore,
  onSessionExpired,
  USER_STORAGE_KEY,
} from "@/config/tokenStore";
import { authService } from "@/services/authService";

// Thông tin hiển thị lưu localStorage; access token chỉ nằm trong bộ nhớ (tokenStore)
interface StoredUser {
  userId: number;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: StoredUser | null;
  login: (userData: StoredUser, accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredUser = (): StoredUser | null => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const { accessToken, ...user } = JSON.parse(raw);
    // Bản cũ lưu cả accessToken trong localStorage: xóa đi
    if (accessToken !== undefined) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Đọc ngay khi khởi tạo để guard route không redirect nhầm lúc F5
  const [user, setUser] = useState<StoredUser | null>(readStoredUser);

  // Refresh token hết hạn / bị thu hồi thì về trạng thái chưa đăng nhập
  useEffect(() => onSessionExpired(() => setUser(null)), []);

  const login = (userData: StoredUser, accessToken: string) => {
    tokenStore.set(accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    // Thu hồi refresh token và xóa cookie phía server; lỗi thì vẫn đăng xuất ở client
    authService.logout().catch(() => {});
    tokenStore.clear();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
