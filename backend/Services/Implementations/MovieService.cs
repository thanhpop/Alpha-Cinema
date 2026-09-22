using backend.Data;
using backend.DTO.Movie;
using backend.Model;
using backend.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations
{
    public class MovieService : IMovieService
    {
        private readonly AppDbContext _db;
        public MovieService(AppDbContext db) => _db = db;

        public async Task<IEnumerable<MovieDto>> GetAllAsync()
        {
            var entities = await _db.Movies.AsNoTracking().ToListAsync();
            return entities.Select(MapToDto);
        }

        public async Task<MovieDto?> GetByIdAsync(long id)
        {
            var entity = await _db.Movies.AsNoTracking()
                .FirstOrDefaultAsync(m => m.id == id);

            return entity == null ? null : MapToDto(entity);
        }

        public async Task<MovieDto> CreateAsync(MovieDto dto)
        {
            var entity = MapToEntity(dto);

            _db.Movies.Add(entity);
            await _db.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<MovieDto?> UpdateAsync(long id, MovieDto dto)
        {
            var existing = await _db.Movies.FindAsync(id);
            if (existing == null) return null;

            existing.title = dto.Title;
            existing.poster = dto.Poster;
            existing.overview = dto.Overview;
            existing.genres = dto.Genres ?? new List<string>();
            existing.duration = dto.Duration;
            existing.language = dto.Language;
            existing.releaseDate = dto.ReleaseDate.Date;
            existing.endDate = dto.EndDate?.Date;
            existing.imdbId = dto.ImdbId;
            existing.filmId = dto.FilmId;
            existing.trailer = dto.Trailer;

            await _db.SaveChangesAsync();
            return MapToDto(existing);
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var existing = await _db.Movies.FindAsync(id);
            if (existing == null) return false;

            _db.Movies.Remove(existing);
            await _db.SaveChangesAsync();
            return true;
        }
        private static MovieDto MapToDto(Movie m)
        {
            return new MovieDto
            {
                Id = m.id,
                Title = m.title,
                Poster = m.poster,
                Overview = m.overview,
                Genres = m.genres,
                Duration = m.duration,
                Language = m.language,
                ReleaseDate = m.releaseDate,
                EndDate = m.endDate,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
                ImdbId = m.imdbId,
                FilmId = m.filmId,
                Trailer = m.trailer
            };
        }

        private static Movie MapToEntity(MovieDto dto)
        {
            return new Movie
            {
                title = dto.Title,
                poster = dto.Poster,
                overview = dto.Overview,
                genres = dto.Genres ?? new List<string>(),
                duration = dto.Duration,
                language = dto.Language,
                releaseDate = dto.ReleaseDate.Date,
                endDate = dto.EndDate?.Date,
                imdbId = dto.ImdbId,
                filmId = dto.FilmId,
                trailer = dto.Trailer
            };
        }
    }
}
