
using backend.DTO.Common;
using backend.Data;
using backend.Helpers;
using backend.DTO;
using backend.DTO.Seat;
using backend.DTO.Showtime;
using backend.Exceptions;
using backend.Model;
using backend.Service.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata.Ecma335;
using System.Security.Cryptography.X509Certificates;

namespace backend.Services.Implementations
{
    public class ShowtimeService : IShowtimeService
    {
        private readonly AppDbContext _db;
        private readonly ISeatService _seatService;

        public ShowtimeService(AppDbContext db, ISeatService seatService)
        {
            _db = db;
            _seatService = seatService;
        }

        public async Task<IEnumerable<ShowtimeDto>> GetAllAsync()
        {
            var list = await _db.Showtimes
                                .AsNoTracking()
                                .Include(s => s.Seats)
                                .OrderBy(s => s.ShowDate)
                                .ThenBy(s => s.ShowTime)
                                .ToListAsync();

            return list.Select(s => new ShowtimeDto
            {
                Id = s.Id,
                MovieId = s.MovieId,
                TheaterId = s.TheaterId,
                ShowDate = s.ShowDate,
                ShowTimeValue = s.ShowTime,
                Price = s.Price,
                TotalSeats = s.TotalSeats,
                AvailableSeats = s.AvailableSeats,
                Seats = s.Seats?.Select(se => new SeatDto
                {
                    Id = se.Id,
                    ShowtimeId = se.ShowtimeId,
                    SeatNumber = se.SeatNumber,
                    IsReserved = se.IsReserved
                }).ToList()
            });
        }

        public async Task<PagedResult<ShowtimeDto>> GetPagedAsync(PagedQuery query)
        {
            var q = _db.Showtimes.AsNoTracking();

            if (query.Keyword is { } kw)
            {
                q = q.Where(s => (s.Movie.title != null && s.Movie.title.Contains(kw)) ||
                                 (s.Theater.name != null && s.Theater.name.Contains(kw)));
            }

            // Danh sách admin không cần chi tiết từng ghế
            return await q
                .OrderByDescending(s => s.ShowDate)
                .ThenByDescending(s => s.ShowTime)
                .Select(s => new ShowtimeDto
                {
                    Id = s.Id,
                    MovieId = s.MovieId,
                    TheaterId = s.TheaterId,
                    ShowDate = s.ShowDate,
                    ShowTimeValue = s.ShowTime,
                    Price = s.Price,
                    TotalSeats = s.TotalSeats,
                    AvailableSeats = s.AvailableSeats
                })
                .ToPagedResultAsync(query);
        }



        public async Task<ShowtimeDto> GetByIdAsync(long id)
        {
            var s = await _db.Showtimes.AsNoTracking()
                        .Include(x => x.Seats)
                        .FirstOrDefaultAsync(x => x.Id == id)
                        ?? throw ShowtimeNotFound();

            return new ShowtimeDto
            {
                Id = s.Id,
                MovieId = s.MovieId,
                TheaterId = s.TheaterId,
                ShowDate = s.ShowDate,
                ShowTimeValue = s.ShowTime,
                Price = s.Price,
                TotalSeats = s.TotalSeats,
                AvailableSeats = s.AvailableSeats,
                Seats = s.Seats?.Select(se => new SeatDto
                {
                    Id = se.Id,
                    ShowtimeId = se.ShowtimeId,
                    SeatNumber = se.SeatNumber,
                    IsReserved = se.IsReserved
                }).ToList(),
            };
        }

        public async Task<IEnumerable<ShowtimeDto>> GetByMovieAsync(long movieId)
        {
            var list = await _db.Showtimes.AsNoTracking()
                            .Where(x => x.MovieId == movieId).Include(x => x.Seats)
                            .OrderBy(x => x.ShowDate).ThenBy(x => x.ShowTime)
                            .ToListAsync();

            return list.Select(s => new ShowtimeDto
            {
                Id = s.Id,
                MovieId = s.MovieId,
                TheaterId = s.TheaterId,
                ShowDate = s.ShowDate,
                ShowTimeValue = s.ShowTime,
                Price = s.Price,
                TotalSeats = s.TotalSeats,
                AvailableSeats = s.AvailableSeats,
                Seats = s.Seats?.Select(se => new SeatDto
                {
                    Id = se.Id,
                    ShowtimeId = se.ShowtimeId,
                    SeatNumber = se.SeatNumber,
                    IsReserved = se.IsReserved
                }).ToList(),
            });
        }

        public async Task<IEnumerable<ShowtimeDto>> GetByTheaterAsync(long theaterId)
        {
            var list = await _db.Showtimes.AsNoTracking()
                            .Where(x => x.TheaterId == theaterId).Include(x => x.Seats)
                            .OrderBy(x => x.ShowDate).ThenBy(x => x.ShowTime)
                            .ToListAsync();

            return list.Select(s => new ShowtimeDto
            {
                Id = s.Id,
                MovieId = s.MovieId,
                TheaterId = s.TheaterId,
                ShowDate = s.ShowDate,
                ShowTimeValue = s.ShowTime,
                Price = s.Price,
                TotalSeats = s.TotalSeats,
                AvailableSeats = s.AvailableSeats,
                Seats = s.Seats?.Select(se => new SeatDto
                {
                    Id = se.Id,
                    ShowtimeId = se.ShowtimeId,
                    SeatNumber = se.SeatNumber,
                   IsReserved = se.IsReserved
                }).ToList(),
            });
        }

        public async Task<IEnumerable<ShowtimeDto>> GetShowtimesByDateAsync(DateTime date)
        {
            var targetDate = date.Date;
            var list = await _db.Showtimes
                                .AsNoTracking()
                                .Where(s => s.ShowDate == targetDate).Include(x => x.Seats)
                                .OrderBy(s => s.ShowTime)
                                .ToListAsync();

            return list.Select(s => new ShowtimeDto
            {
                Id = s.Id,
                MovieId = s.MovieId,
                TheaterId = s.TheaterId,
                ShowDate = s.ShowDate,
                ShowTimeValue = s.ShowTime,
                Price = s.Price,
                TotalSeats = s.TotalSeats,
                AvailableSeats = s.AvailableSeats,
                Seats = s.Seats?.Select(se => new SeatDto
                {
                    Id = se.Id,
                    ShowtimeId = se.ShowtimeId,
                    SeatNumber = se.SeatNumber,
                    IsReserved = se.IsReserved
                }).ToList(),
            });
        }

        public async Task<IEnumerable<ShowtimeDto>> GetAvailableShowtimesAsync(DateTime? fromDate = null)
        {
            var now = DateTimeHelper.Now;
            var today = now.Date;

            var cutoffTime = now.TimeOfDay.Add(TimeSpan.FromMinutes(15));

            var startDate = (fromDate ?? today).Date;
            var endDate = startDate.AddDays(6);

            var list = await _db.Showtimes
                .AsNoTracking()
                .Where(s =>
                        s.AvailableSeats > 0 &&
                        s.ShowDate >= startDate &&
                        s.ShowDate <= endDate &&
                        (s.ShowDate > today || (s.ShowDate == today && s.ShowTime > cutoffTime))
                )
                .OrderBy(s => s.ShowDate)
                .ThenBy(s => s.ShowTime)
                .Select(s => new ShowtimeDto
                {
                    Id = s.Id,
                    MovieId = s.MovieId,
                    TheaterId = s.TheaterId,
                    ShowDate = s.ShowDate,
                    ShowTimeValue = s.ShowTime,
                    Price = s.Price,
                    TotalSeats = s.TotalSeats,
                    AvailableSeats = s.AvailableSeats
                })
                .ToListAsync();

            return list;
        }

        public async Task<IEnumerable<ShowtimeDto>> GetAvailableShowtimesForMovieAsync(long movieId, DateTime? fromDate = null)
        {
            var date = (fromDate ?? DateTimeHelper.Today).Date;

            var list = await _db.Showtimes
                .AsNoTracking()
                .Where(s => s.MovieId == movieId && s.ShowDate >= date && s.AvailableSeats > 0).Include(x => x.Seats)
                .OrderBy(s => s.ShowDate).ThenBy(s => s.ShowTime)
                .Select(s => new ShowtimeDto
                {
                    Id = s.Id,
                    MovieId = s.MovieId,
                    TheaterId = s.TheaterId,
                    ShowDate = s.ShowDate,
                    ShowTimeValue = s.ShowTime,
                    Price = s.Price,
                    TotalSeats = s.TotalSeats,
                    AvailableSeats = s.AvailableSeats,

                })
                .ToListAsync();

            return list;
        }

        public async Task<IEnumerable<ShowtimeDto>> GetUpcomingShowtimesAsync()
        {
            var fromDate = DateTimeHelper.Today.AddDays(8);

            var list = await _db.Showtimes
                .AsNoTracking()
                .Where(s => s.ShowDate >= fromDate)
                .OrderBy(s => s.ShowDate)
                .ThenBy(s => s.ShowTime)
                .Select(s => new ShowtimeDto
                {
                    Id = s.Id,
                    MovieId = s.MovieId,
                    TheaterId = s.TheaterId,
                    ShowDate = s.ShowDate,
                    ShowTimeValue = s.ShowTime,
                    Price = s.Price,
                    TotalSeats = s.TotalSeats,
                    AvailableSeats = s.AvailableSeats
                })
                .ToListAsync();

            return list;
        }
        public async Task<IEnumerable<ShowtimeDto>> GetUpcomingShowtimesByMovieAsync(long movieId)
        {
            var now = DateTimeHelper.Now;
            var today = now.Date;
            var currentTime = now.TimeOfDay;

            var list = await _db.Showtimes
                .AsNoTracking()
                .Where(s =>
                    s.MovieId == movieId &&
                    (
                        s.ShowDate > today ||
                        (s.ShowDate == today && s.ShowTime > currentTime)
                    )
                )
                .OrderBy(s => s.ShowDate)
                .ThenBy(s => s.ShowTime)
                .Select(s => new ShowtimeDto
                {
                    Id = s.Id,
                    MovieId = s.MovieId,
                    TheaterId = s.TheaterId,
                    ShowDate = s.ShowDate,
                    ShowTimeValue = s.ShowTime,
                    Price = s.Price,
                    TotalSeats = s.TotalSeats,
                    AvailableSeats = s.AvailableSeats
                })
                .ToListAsync();

            return list;
        }


        public async Task<ShowtimeDto> CreateAsync(ShowtimeDto dto)
        {
            var movieExists = await _db.Movies.AnyAsync(m => m.id == dto.MovieId);
            if (!movieExists) throw new NotFoundException("Không tìm thấy phim.");

            var theater = await _db.Theaters.FirstOrDefaultAsync(t => t.id == dto.TheaterId);
            if (theater == null) throw TheaterNotFound();
            if (dto.TotalSeats > theater.capacity)
            {
                throw new BadRequestException($"Số ghế ({dto.TotalSeats}) không được vượt quá sức chứa của rạp ({theater.capacity}).");
            }


            var time = DateTimeHelper.ParseTimeOrThrow(dto.ShowTime, "Giờ chiếu");

            var entity = new Showtime
            {
                MovieId = dto.MovieId,
                TheaterId = dto.TheaterId,
                ShowDate = dto.ShowDate.Date,
                ShowTime = time,
                Price = dto.Price,
                TotalSeats = dto.TotalSeats,
                AvailableSeats = dto.TotalSeats,
                Seats = new List<Seat>()
            };


            int totalSeats = dto.TotalSeats;
            for (int i = 1; i <= totalSeats; i++)
            {
                entity.Seats.Add(new Seat
                {
                    SeatNumber = $"{(char)('A' + ((i - 1) / 10))}{((i - 1) % 10) + 1}",
                    IsReserved = false
                });
                
            }

            _db.Showtimes.Add(entity);
            await _db.SaveChangesAsync();

            var result = new ShowtimeDto
            {
                Id = entity.Id,
                MovieId = entity.MovieId,
                TheaterId = entity.TheaterId,
                ShowDate = entity.ShowDate,
                ShowTimeValue = entity.ShowTime,
                Price = entity.Price,
                TotalSeats = entity.TotalSeats,
                AvailableSeats = entity.AvailableSeats,
                Seats = entity.Seats?.Select(se => new SeatDto
                {
                    Id = se.Id,
                    ShowtimeId = se.ShowtimeId,
                    SeatNumber = se.SeatNumber,
                    IsReserved = se.IsReserved
                }).ToList(),
            };

            return result;
        }

        public async Task<ShowtimeDto> UpdateAsync(long id, ShowtimeDto dto)
        {
            var existing = await _db.Showtimes
                                    .Include(s => s.Seats)
                                    .FirstOrDefaultAsync(s => s.Id == id)
                                    ?? throw ShowtimeNotFound();

            var theaterExists = await _db.Theaters.AnyAsync(t => t.id == dto.TheaterId);
            if (!theaterExists)
            {
                throw TheaterNotFound();
            }

            var parsedTime = DateTimeHelper.ParseTimeOrThrow(dto.ShowTime, "Giờ chiếu");

            existing.MovieId = dto.MovieId;
            existing.TheaterId = dto.TheaterId;
            existing.ShowDate = dto.ShowDate.Date;
            existing.ShowTime = parsedTime;
            existing.Price = dto.Price;

            await _db.SaveChangesAsync();

            var result = new ShowtimeDto
            {
                Id = existing.Id,
                MovieId = existing.MovieId,
                TheaterId = existing.TheaterId,
                ShowDate = existing.ShowDate,
                ShowTimeValue = existing.ShowTime,
                Price = existing.Price,
                TotalSeats = existing.TotalSeats,
                AvailableSeats = existing.AvailableSeats,
                Seats = existing.Seats?.Select(se => new SeatDto
                {
                    Id = se.Id,
                    ShowtimeId = se.ShowtimeId,
                    SeatNumber = se.SeatNumber,
                    IsReserved = se.IsReserved
                }).ToList()
            };

            return result;
        }


        public async Task DeleteAsync(long id)
        {
            var entity = await _db.Showtimes.FindAsync(id) ?? throw ShowtimeNotFound();

            await _seatService.DeleteByShowtimeAsync(id);
            _db.Showtimes.Remove(entity);
            await _db.SaveChangesAsync();
        }

        private static NotFoundException ShowtimeNotFound() => new("Không tìm thấy suất chiếu.");

        private static NotFoundException TheaterNotFound() => new("Không tìm thấy rạp.");


    }
}
