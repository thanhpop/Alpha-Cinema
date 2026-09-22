using backend.DTO.Seat;
using backend.Helpers;
using backend.Helpers.Json;
using System.Text.Json.Serialization;

namespace backend.DTO.Reservation
{
    public class ReservationDto
    {
        public string Id { get; set; } = null!;
        public long UserId { get; set; }
        public long ShowtimeId { get; set; }

        [JsonConverter(typeof(VnDateTimeJsonConverter))]
        public DateTime ReservationTime { get; set; }

        public string ReservationTimeIso => DateTimeHelper.FormatIsoDateTime(ReservationTime);

        [JsonConverter(typeof(VnNullableDateJsonConverter))]
        public DateTime? ShowDate { get; set; }

        public string? ShowDateIso => DateTimeHelper.FormatIsoDate(ShowDate);
        [JsonIgnore]
        public TimeSpan? ShowTimeValue { get; set; }
        public string? ShowTime =>
            ShowTimeValue.HasValue ? DateTimeHelper.FormatTime(ShowTimeValue.Value) : null;

        public string? ShowDateTimeText => ShowDate.HasValue
            ? $"{DateTimeHelper.FormatDate(ShowDate.Value)} {ShowTime}".TrimEnd()
            : null;

        public int StatusId { get; set; }
        public string StatusValue { get; set; } = string.Empty;
        public decimal TotalPrice { get; set; }
        public bool Paid { get; set; }

        public string? MovieName { get; set; }
        public string? TheaterName { get; set; }
        public List<SeatDto> Seats { get; set; } = new List<SeatDto>();
    }
}
