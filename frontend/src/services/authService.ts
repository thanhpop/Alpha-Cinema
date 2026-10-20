import instance from "@/config/axios";
import type {
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
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

  async logout(): Promise<void> {
    await instance.post("/auth/logout");
  },

  async forgotPassword(email: string): Promise<string> {
    const res = await instance.post("/auth/forgot-password", { email });
    return String(res.data?.message ?? "");
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<string> {
    const res = await instance.post("/auth/reset-password", payload);
    return String(res.data?.message ?? "");
  },

  async changePassword(payload: ChangePasswordPayload): Promise<string> {
    const res = await instance.post("/auth/change-password", payload);
    return String(res.data?.message ?? "");
  },
};
