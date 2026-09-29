
import instance from '@/config/axios';
import { toPagedParams, type PagedQuery, type PagedResult } from '@/types/Pagination';

export interface User {
  id: number;
  username: string;
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
};
