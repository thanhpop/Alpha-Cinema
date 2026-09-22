import instance from "@/config/axios";

export interface Seat {
  id: number;
  showtimeId: number;
  seatNumber: string;
  isReserved: boolean;
}

export interface Showtime {
  id: number;
  movieId: number;
  theaterId: number;
  showDate: string;
  showDateIso: string;
  showTime: string;
  showDateTimeText: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  seats?: Seat[];
}

function toShowtime(s: any): Showtime {
  return {
    id: Number(s.id),
    movieId: Number(s.movieId),
    theaterId: Number(s.theaterId),
    showDate: String(s.showDate ?? ""),
    showDateIso: String(s.showDateIso ?? ""),
    showTime: String(s.showTime ?? ""),
    showDateTimeText: String(s.showDateTimeText ?? ""),
    price: Number(s.price),
    totalSeats: Number(s.totalSeats),
    availableSeats: Number(s.availableSeats),
    seats: Array.isArray(s.seats)
      ? s.seats.map((seat: any) => ({
          id: Number(seat.id),
          showtimeId: Number(seat.showtimeId),
          seatNumber: String(seat.seatNumber),
          isReserved: Boolean(seat.isReserved),
        }))
      : [],
  };
}

export const showtimeService = {

  async getAll(): Promise<Showtime[]> {
    const res = await instance.get("/showtimes");
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list.map(toShowtime) : [];
  },

  async getById(id: number): Promise<Showtime> {
    const res = await instance.get(`/showtimes/${id}`);
    if (!res.data?.data) throw new Error("Showtime not found");
    return toShowtime(res.data.data);
  },

  async create(payload: Partial<Showtime>): Promise<Showtime> {
    const res = await instance.post("/showtimes", payload);
    if (!res.data?.data) throw new Error("Create failed");
    return toShowtime(res.data.data);
  },

  async update(id: number, payload: Partial<Showtime>): Promise<Showtime> {
    const res = await instance.put(`/showtimes/${id}`, payload);
    if (!res.data?.data) throw new Error("Update failed");
    return toShowtime(res.data.data);
  },

  async delete(id: number): Promise<void> {
    await instance.delete(`/showtimes/${id}`);
  },


  async getByMovie(movieId: number): Promise<Showtime[]> {
    const res = await instance.get(`/showtimes/movie/${movieId}`);
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list.map(toShowtime) : [];
  },

  async getByTheater(theaterId: number): Promise<Showtime[]> {
    const res = await instance.get(`/showtimes/theater/${theaterId}`);
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list.map(toShowtime) : [];
  },

  async getByDate(date: string): Promise<Showtime[]> {
    const res = await instance.get(`/showtimes/date/${date}`);
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list.map(toShowtime) : [];
  },


  async getAvailable(fromDate?: string): Promise<Showtime[]> {
    const res = await instance.get("/showtimes/available", {
      params: fromDate ? { fromDate } : undefined,
    });
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list.map(toShowtime) : [];
  },
    async getUpcoming(): Promise<Showtime[]> {
    const res = await instance.get("/showtimes/upcoming");
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list.map(toShowtime) : [];
  },

  async getUpcomingByMovie(movieId: number): Promise<Showtime[]> {
    const res = await instance.get(`/showtimes/upcoming/movie/${movieId}`);
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list.map(toShowtime) : [];
  },

};
