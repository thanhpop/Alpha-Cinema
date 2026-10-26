using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using backend.Helpers;
using backend.Helpers.Json;
using backend.Model;

namespace backend.DTO.Movie
{
    public class MovieDto : AbstractMappedEntity
    {
        public long Id { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập tên phim.")]
        public string? Title { get; set; }

        [Url(ErrorMessage = "Link poster không hợp lệ.")]
        public string? Poster { get; set; }

        public string? Overview { get; set; }

        public List<string> Genres { get; set; } = new();

        [Range(0, 1000, ErrorMessage = "Thời lượng phải từ 0 đến 1000 phút.")]
        public int Duration { get; set; }

        public string? Language { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập ngày khởi chiếu.")]
        [JsonConverter(typeof(VnDateJsonConverter))]
        public DateTime ReleaseDate { get; set; }

        [JsonConverter(typeof(VnNullableDateJsonConverter))]
        public DateTime? EndDate { get; set; }

      
        public string ReleaseDateIso => DateTimeHelper.FormatIsoDate(ReleaseDate);

        public string? EndDateIso => DateTimeHelper.FormatIsoDate(EndDate);

        [Required(ErrorMessage = "Vui lòng chọn nhãn độ tuổi.")]
        [RegularExpression("^(P|K|T13|T16|T18)$", ErrorMessage = "Nhãn độ tuổi phải là P, K, T13, T16 hoặc T18.")]
        public string? AgeRating { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập IMDB id.")]
        public string ImdbId { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập Film id.")]
        public string FilmId { get; set; } = null!;

        public string? Trailer { get; set; }
    }
}
