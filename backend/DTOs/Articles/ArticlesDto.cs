using backend.Helpers;
using backend.Helpers.Json;
using System.Text.Json.Serialization;

namespace backend.DTO.Articles
{
    public class ArticlesDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = null!;
        public string Summary { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public string Category { get; set; } = null!;
        [JsonConverter(typeof(VnDateJsonConverter))]
        public DateTime CreatedAt { get; set; }

        public string CreatedAtIso => DateTimeHelper.FormatIsoDateTime(CreatedAt);

        public bool IsActive { get; set; }
    }
}
