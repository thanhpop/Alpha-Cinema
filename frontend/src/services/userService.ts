
import instance from '@/config/axios';
import { toPagedParams, type PagedQuery, type PagedResult } from '@/types/Pagination';

export type Gender = "male" | "female" | "other";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

export const PHONE_PATTERN = /^(0|\+84)\d{9}$/;

export interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  dateOfBirthIso: string | null;
}

export type UserProfile = User;

export interface UpdateProfilePayload {
  phone: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
}

export interface UpdateUserPayload extends UpdateProfilePayload {
  email: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const res = await instance.get<ApiResponse<User[]>>("/users");
    return res.data.data;
  },
  getPaged: async (query: PagedQuery): Promise<PagedResult<User>> => {
    const res = await instance.get<ApiResponse<PagedResult<User>>>("/users/paged", {
      params: toPagedParams(query),
    });
    return res.data.data;
  },
  getMe: async (): Promise<UserProfile> => {
    const res = await instance.get<ApiResponse<UserProfile>>("/users/me");
    return res.data.data;
  },
  updateMe: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const res = await instance.put<ApiResponse<UserProfile>>("/users/me", payload);
    return res.data.data;
  },
  update: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const res = await instance.put<ApiResponse<User>>(`/users/${id}`, payload);
    return res.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await instance.delete(`/users/${id}`);
  },
};
