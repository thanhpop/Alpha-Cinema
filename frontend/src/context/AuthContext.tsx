import React, { createContext, useContext, useState } from "react";

interface StoredUser {
  userId: number;
  username: string;
  email: string;
  accessToken: string;
  role: string;
}

interface AuthContextType {
  user: StoredUser | null;
  login: (userData: StoredUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Đọc ngay khi khởi tạo để guard route không redirect nhầm lúc F5
  const [user, setUser] = useState<StoredUser | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (userData: StoredUser) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
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
