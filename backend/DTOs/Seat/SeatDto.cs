using System.ComponentModel.DataAnnotations;

namespace backend.DTO.Seat
{
    public class SeatDto
    {
        public long Id { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn suất chiếu.")]
        public long ShowtimeId { get; set; }


        public string? SeatNumber { get; set; }

        public bool IsReserved { get; set; } = false;


    }
}
