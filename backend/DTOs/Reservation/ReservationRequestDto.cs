namespace backend.DTO.Reservation
{
    public class ReservationRequestDto
    {
        public long ShowtimeId { get; set; }
        public List<long> SeatIds { get; set; } = new();
    }
}
