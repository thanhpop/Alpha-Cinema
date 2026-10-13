
import instance from '@/config/axios';
import { toPagedParams, type PagedQuery, type PagedResult } from '@/types/Pagination';

export interface User {
  id: number;
  username: string;
  email: string;
}

export type Gender = "male" | "female" | "other";

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  dateOfBirthIso: string | null;
}

export interface UpdateProfilePayload {
  phone: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
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
};
