using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Model
{
    [Table("movie")]
    public class Movie : AbstractMappedEntity
    {
        [Key]
        [Column("id")]
        public long id { get; set; }

        [Column("title")]

  
        public string? title { get; set; }
        [Column("poster")]
        public string? poster { get; set; }

        [Column("overview", TypeName = "text")]
        public string? overview { get; set; }
        public List<string> genres { get; set; } = new();

        [Column("duration")]
        public int duration { get; set; }

        [Column("language")]
        public string? language { get; set; }

        [Column("release_date")]
        public DateTime releaseDate { get; set; }

        [Column("end_date")]
        public DateTime? endDate { get; set; }

        [Column("age_rating")]
        [MaxLength(5)]
        public string? ageRating { get; set; }
        [Required]

        [Column("imdb_id")]
        public required string imdbId { get; set; }
        [Required]
        [Column("film_id")]
        public required string filmId { get; set; }

        [Column("trailer")]
        public string? trailer { get; set; }

    }
}
