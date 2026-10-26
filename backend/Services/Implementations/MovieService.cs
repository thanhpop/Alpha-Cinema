using backend.DTO.Common;
using backend.Helpers;
using backend.Data;
using backend.DTO.Movie;
using backend.Exceptions;
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

        public async Task<PagedResult<MovieDto>> GetPagedAsync(PagedQuery query)
        {
            var q = _db.Movies.AsNoTracking();

            if (query.Keyword is { } kw)
                q = q.Where(m => m.title != null && m.title.Contains(kw));

            var paged = await q.OrderByDescending(m => m.id).ToPagedResultAsync(query);
            return paged.Map(MapToDto);
        }

        public async Task<IEnumerable<ShowingMovieDto>> GetNowShowingAsync()
        {
            var today = DateTimeHelper.Today;

            var movies = await _db.Movies.AsNoTracking()
                .Where(m => m.releaseDate <= today && (m.endDate == null || m.endDate >= today))
                .OrderByDescending(m => m.releaseDate).ThenByDescending(m => m.id)
                .ToListAsync();

            return await ToShowingAsync(movies);
        }

        public async Task<IEnumerable<ShowingMovieDto>> GetComingSoonAsync()
        {
            var today = DateTimeHelper.Today;

            var movies = await _db.Movies.AsNoTracking()
                .Where(m => m.releaseDate > today)
                .OrderBy(m => m.releaseDate).ThenBy(m => m.id)
                .ToListAsync();

            return await ToShowingAsync(movies);
        }

        public async Task<MovieDto> GetByIdAsync(long id)
        {
            var entity = await _db.Movies.AsNoTracking()
                .FirstOrDefaultAsync(m => m.id == id)
                ?? throw MovieNotFound();

            return MapToDto(entity);
        }

        public async Task<MovieDto> CreateAsync(MovieDto dto)
        {
            var entity = MapToEntity(dto);

            _db.Movies.Add(entity);
            await _db.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<MovieDto> UpdateAsync(long id, MovieDto dto)
        {
            var existing = await _db.Movies.FindAsync(id) ?? throw MovieNotFound();

            existing.title = dto.Title;
            existing.poster = dto.Poster;
            existing.overview = dto.Overview;
            existing.genres = dto.Genres ?? new List<string>();
            existing.duration = dto.Duration;
            existing.language = dto.Language;
            existing.releaseDate = dto.ReleaseDate.Date;
            existing.endDate = dto.EndDate?.Date;
            existing.ageRating = dto.AgeRating;
            existing.imdbId = dto.ImdbId;
            existing.filmId = dto.FilmId;
            existing.trailer = dto.Trailer;

            await _db.SaveChangesAsync();
            return MapToDto(existing);
        }

        public async Task DeleteAsync(long id)
        {
            var existing = await _db.Movies.FindAsync(id) ?? throw MovieNotFound();

            _db.Movies.Remove(existing);
            await _db.SaveChangesAsync();
        }

        private static NotFoundException MovieNotFound() => new("Không tìm thấy phim.");

        private async Task<IEnumerable<ShowingMovieDto>> ToShowingAsync(List<Movie> movies)
        {
            var now = DateTimeHelper.Now;
            var today = now.Date;
            var lastDate = today.AddDays(6);
            var cutoffTime = now.TimeOfDay.Add(TimeSpan.FromMinutes(15));

            var bookableMovieIds = (await _db.Showtimes.AsNoTracking()
                .Where(s =>
                    s.AvailableSeats > 0 &&
                    s.ShowDate <= lastDate &&
                    (s.ShowDate > today || (s.ShowDate == today && s.ShowTime > cutoffTime)))
                .Select(s => s.MovieId)
                .Distinct()
                .ToListAsync())
                .ToHashSet();

            return movies.Select(m =>
            {
                var dto = MapToDto<ShowingMovieDto>(m);
                dto.HasShowtimes = bookableMovieIds.Contains(m.id);
                return dto;
            });
        }

        private static MovieDto MapToDto(Movie m) => MapToDto<MovieDto>(m);

        private static T MapToDto<T>(Movie m) where T : MovieDto, new()
        {
            return new T
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
                AgeRating = m.ageRating,
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
                ageRating = dto.AgeRating,
                imdbId = dto.ImdbId,
                filmId = dto.FilmId,
                trailer = dto.Trailer
            };
        }
    }
}
