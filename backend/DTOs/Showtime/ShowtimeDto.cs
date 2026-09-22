using backend.DTO.Seat;
using backend.Helpers;
using backend.Helpers.Json;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.DTO.Showtime
{
    public class ShowtimeDto
    {
        private string? _showTime;

        public long Id { get; set; }

        [Required(ErrorMessage = "MovieId is required.")]
        public long MovieId { get; set; }

        [Required(ErrorMessage = "TheaterId is required.")]
        public long TheaterId { get; set; }

        [JsonConverter(typeof(VnDateJsonConverter))]
        public DateTime ShowDate { get; set; }

        public string ShowDateIso => DateTimeHelper.FormatIsoDate(ShowDate);

        [JsonIgnore]
        public TimeSpan? ShowTimeValue { get; set; }


        public string ShowTime
        {
            get => _showTime
                   ?? (ShowTimeValue.HasValue ? DateTimeHelper.FormatTime(ShowTimeValue.Value) : string.Empty);
            set => _showTime = value;
        }

        public string ShowDateTimeText => $"{DateTimeHelper.FormatDate(ShowDate)} {ShowTime}".TrimEnd();

        public decimal Price { get; set; }

        public int TotalSeats { get; set; }

        public int AvailableSeats { get; set; }

        public List<SeatDto>? Seats { get; set; }
    }
}
