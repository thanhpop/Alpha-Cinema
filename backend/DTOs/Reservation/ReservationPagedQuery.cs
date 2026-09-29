using backend.DTO.Common;

namespace backend.DTO.Reservation
{
    public class ReservationPagedQuery : PagedQuery
    {
        // Lọc theo ngày đặt (yyyy-MM-dd), toDate tính cả ngày
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }

        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }

        // PENDING | CONFIRMED | CANCELED
        public string? Status { get; set; }
        public bool? Paid { get; set; }
    }
}
