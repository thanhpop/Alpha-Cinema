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

        [Required(ErrorMessage = "Title is required.")]
        public string? Title { get; set; }

        [Url(ErrorMessage = "Poster must be a valid URL.")]
        public string? Poster { get; set; }

        public string? Overview { get; set; }

        public List<string> Genres { get; set; } = new();

        [Range(0, 1000, ErrorMessage = "Duration must be a number between 0 and 1000.")]
        public int Duration { get; set; }

        public string? Language { get; set; }

        [Required(ErrorMessage = "Release date is required.")]
        [JsonConverter(typeof(VnDateJsonConverter))]
        public DateTime ReleaseDate { get; set; }

        [JsonConverter(typeof(VnNullableDateJsonConverter))]
        public DateTime? EndDate { get; set; }

      
        public string ReleaseDateIso => DateTimeHelper.FormatIsoDate(ReleaseDate);

        public string? EndDateIso => DateTimeHelper.FormatIsoDate(EndDate);

        [Required(ErrorMessage = "IMDB id is required.")]
        public string ImdbId { get; set; } = null!;

        [Required(ErrorMessage = "Film id is required.")]
        public string FilmId { get; set; } = null!;

        public string? Trailer { get; set; }
    }
}
