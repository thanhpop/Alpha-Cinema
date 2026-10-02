export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dob: string;
  gender: string;
  phone: string;
  role: string[];
}

export interface AuthResponse {
  accessToken: string;
  userId: number;
  username: string;
  email: string;
  role: string;
}
