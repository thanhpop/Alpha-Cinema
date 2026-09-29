import instance from "@/config/axios";
import type { Article } from "@/types/Article";
import { toPagedParams, type PagedQuery, type PagedResult } from "@/types/Pagination";

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const articleService = {
  getAll() {
    return instance.get<ApiResponse<Article[]>>("/articles");
  },


  async getPaged(query: PagedQuery): Promise<PagedResult<Article>> {
    const res = await instance.get<ApiResponse<PagedResult<Article>>>("/articles/paged", {
      params: toPagedParams(query),
    });
    return res.data.data;
  },

  getActive() {
    return instance.get<ApiResponse<Article[]>>("/articles/active");
  },


  getById(id: number) {
    return instance.get<ApiResponse<Article>>(`/articles/${id}`);
  },


  create(data: Omit<Article, "id" | "createdAt">) {
    return instance.post<ApiResponse<Article>>("/articles", data);
  },


  update(id: number, data: Omit<Article, "id" | "createdAt">) {
    return instance.put<ApiResponse<Article>>(`/articles/${id}`, data);
  },

  delete(id: number) {
    return instance.delete<ApiResponse<null>>(`/articles/${id}`);
  },
};
