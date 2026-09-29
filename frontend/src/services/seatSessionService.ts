import instance from "@/config/axios";

// Backend lấy userId từ token, không cần truyền lên
export const seatSessionService = {
  startSession: async (showtimeId: number) => {
    const res = await instance.post(
      `/seat-sessions/start`,
      null,
      {
        params: { showtimeId },
      }
    );
    return res.data;
  },

  addSeats: async (showtimeId: number, seatIds: number[]) => {
    const res = await instance.post(
      `/seat-sessions/${showtimeId}/add`,
      seatIds
    );
    return res.data;
  },

  removeSeats: async (showtimeId: number, seatIds: number[]) => {
    const res = await instance.post(
      `/seat-sessions/${showtimeId}/remove`,
      seatIds
    );
    return res.data;
  },

  getSnapshot: async (showtimeId: number) => {
    const res = await instance.get(`/seat-sessions/${showtimeId}/snapshot`);
    return res.data;
  },
};
