namespace backend.DTO.Reservation
{
    // Thống kê trên toàn bộ đơn CONFIRMED của user (không phụ thuộc trang đang xem)
    public class UserReservationSummaryDto
    {
        public int TotalTickets { get; set; }
        public decimal TotalSpent { get; set; }
    }
}
