import instance from "@/config/axios";

export interface SeatResponse {
  id: number;
  showtimeId: number;
  seatNumber: string;
  isReserved: boolean;
}


export interface CreateReservationRequest {
  userId: number;
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
    getReservationsByUserId: async (
    userId: number
  ): Promise<ReservationResponse[]> => {
    const res = await instance.get(`/reservation/user/${userId}`);
    return res.data.data;
  },
};
