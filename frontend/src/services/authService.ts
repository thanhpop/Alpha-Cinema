import instance from "@/config/axios";
import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
} from "@/types/Auth";

function toAuthResponse(d: any): AuthResponse {
  return {
    accessToken: String(d.accessToken ?? ""),
    userId: Number(d.userId),
    username: String(d.username ?? ""),
    email: String(d.email ?? ""),
    role: String(d.role)
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await instance.post("/auth/login", payload);
    if (!res.data?.data) throw new Error("Login failed");
    return toAuthResponse(res.data.data);
  },

  async register(payload: RegisterPayload): Promise<{
    username: string;
    email: string;
  }> {
    const res = await instance.post("/auth/register", payload);
    if (!res.data?.data) throw new Error("Register failed");
    return {
      username: res.data.data.username,
      email: res.data.data.email,
    };
  },

  // Refresh token nằm trong cookie HttpOnly nên không cần gửi kèm; refresh do axios interceptor tự xử lý
  async logout(): Promise<void> {
    await instance.post("/auth/logout");
  },
};
