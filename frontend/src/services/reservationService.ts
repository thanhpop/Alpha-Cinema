import instance from "@/config/axios";
import { toPagedParams, type PagedQuery, type PagedResult } from "@/types/Pagination";

export interface SeatResponse {
  id: number;
  showtimeId: number;
  seatNumber: string;
  isReserved: boolean;
}


export interface CreateReservationRequest {
  showtimeId: number;
  seatIds: number[];
}

export interface ReservationResponse {
  id: string;
  userId: number;
  showtimeId: number;
  reservationTime: string;
  reservationTimeIso: string;
  showDate: string | null;
  showDateIso: string | null;
  showTime: string | null;
  showDateTimeText: string | null;
  statusId: number;
  statusValue: string;
  totalPrice: number;
  paid: boolean;
  movieName: string;
  theaterName: string;
  seats?: SeatResponse[];
}

export interface ReservationFilters {
  fromDate?: string; // yyyy-MM-dd
  toDate?: string; // yyyy-MM-dd
  minPrice?: number | null;
  maxPrice?: number | null;
  status?: string | null;
  paid?: boolean | null;
}

export interface UserReservationSummary {
  totalTickets: number;
  totalSpent: number;
}

export const reservationService = {
  createReservation: async (
    data: CreateReservationRequest
  ): Promise<ReservationResponse> => {
    const res = await instance.post("/reservation", data);
    return res.data.data; 
  },
    cancelReservation: async (reservationId: string): Promise<void> => {
    await instance.put(`/reservation/${reservationId}`);

  },
    getAllReservations: async (): Promise<ReservationResponse[]> => {
    const res = await instance.get("/reservation");
    return res.data;
  },
    getPaged: async (
    query: PagedQuery & ReservationFilters
  ): Promise<PagedResult<ReservationResponse>> => {
    const res = await instance.get("/reservation/paged", { params: toPagedParams(query) });
    return res.data.data;
  },
  // Backend lấy user từ token, không cần truyền userId
    getMyReservations: async (
    query: PagedQuery
  ): Promise<PagedResult<ReservationResponse>> => {
    const res = await instance.get("/reservation/me", {
      params: toPagedParams(query),
    });
    return res.data.data;
  },
    getMySummary: async (): Promise<UserReservationSummary> => {
    const res = await instance.get("/reservation/me/summary");
    return res.data.data;
  },
};
