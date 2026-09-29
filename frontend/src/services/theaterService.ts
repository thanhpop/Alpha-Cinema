import instance from '@/config/axios';
import type { Theater } from '@/types/Theater';
import { mapPagedResult, toPagedParams, type PagedQuery, type PagedResult } from '@/types/Pagination';

function toTheater(t: any): Theater {
  return {
    id: Number(t.id),
    name: String(t.name ?? ''),
    location: String(t.location ?? ''),
    capacity: typeof t.capacity === 'number' ? t.capacity : (Number(t.capacity) || 0),
  };
}

export const theaterService = {

  async getTheaters(q?: string): Promise<Theater[]> {
    const params = q ? { location: q } : undefined;
    const res = await instance.get('/theater', { params });
    const list = res.data?.data ?? [];
    return (Array.isArray(list) ? list : []).map(toTheater);
  },

  async getPaged(query: PagedQuery): Promise<PagedResult<Theater>> {
    const res = await instance.get('/theater/paged', { params: toPagedParams(query) });
    return mapPagedResult(res.data.data, toTheater);
  },

  async getById(id: number): Promise<Theater | null> {
    const res = await instance.get(`/theater/${encodeURIComponent(String(id))}`);
    const payload = res.data?.data;
    return payload ? toTheater(payload) : null;
  },

  async createTheater(payload: Omit<Theater, 'id'>): Promise<Theater> {
    const res = await instance.post('/theater', payload);
    const created = res.data?.data;
    if (!created) throw new Error('Create theater failed');
    return toTheater(created);
  },

  async updateTheater(id: number, payload: Omit<Theater, 'id'>): Promise<Theater> {
    const body = { ...payload, id: Number(id) };
    const res = await instance.put(`/theater/${encodeURIComponent(String(id))}`, body);
    const updated = res.data?.data;
    if (!updated) throw new Error('Update theater failed');
    return toTheater(updated);
  },

  async deleteTheater(id: number): Promise<void> {
    await instance.delete(`/theater/${encodeURIComponent(String(id))}`);
  },
};

export default theaterService;
