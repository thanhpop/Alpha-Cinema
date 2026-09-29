
import instance from "@/config/axios";

import type { Banner, ApiResponse } from '@/types/Banner';
import { toPagedParams, type PagedQuery, type PagedResult } from '@/types/Pagination';

export const bannerService = {
  getAll() {
    return instance.get<ApiResponse<Banner[]>>("/banners");
  },
  async getPaged(query: PagedQuery): Promise<PagedResult<Banner>> {
    const res = await instance.get<ApiResponse<PagedResult<Banner>>>("/banners/paged", {
      params: toPagedParams(query),
    });
    return res.data.data;
  },
   getActive() {
    return instance.get<ApiResponse<Banner[]>>("/banners/active");
  },

  create(data: Omit<Banner, "id">) {
    return instance.post<ApiResponse<Banner>>("/banners", data);
  },

  update(id: number, data: Omit<Banner, "id">) {
    return instance.put<ApiResponse<Banner>>(`/banners/${id}`, data);
  },

  delete(id: number) {
    return instance.delete<ApiResponse<null>>(`/banners/${id}`);
  },
};
