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

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
