
using backend.Data;
using backend.Helpers;
using backend.DTO;
using backend.DTO.Seat;
using backend.DTO.Showtime;
using backend.Model;
using backend.Service.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
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



        public async Task<ShowtimeDto?> GetByIdAsync(long id)
        {
            var s = await _db.Showtimes.AsNoTracking()
                        .Include(x => x.Seats)
                        .FirstOrDefaultAsync(x => x.Id == id);

            if (s == null) return null;

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
            if (!movieExists) throw new KeyNotFoundException($"Movie {dto.MovieId} not found.");

            var theater = await _db.Theaters.FirstOrDefaultAsync(t => t.id == dto.TheaterId);
            if (theater == null) throw new KeyNotFoundException($"Theater {dto.TheaterId} not found.");
            if (dto.TotalSeats > theater.capacity)
            {
                throw new ArgumentException($"TotalSeats ({dto.TotalSeats}) cannot be greater than theater capacity ({theater.capacity}).");
            }


            var time = DateTimeHelper.ParseTimeOrThrow(dto.ShowTime, "ShowTime");

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

        public async Task<ShowtimeDto?> UpdateAsync(long id, ShowtimeDto dto)
        {
            var existing = await _db.Showtimes
                                    .Include(s => s.Seats) 
                                    .FirstOrDefaultAsync(s => s.Id == id);

            var theater = await _db.Theaters.FirstOrDefaultAsync(t => t.id == dto.TheaterId);
            if (theater == null)
            {
                throw new KeyNotFoundException($"Theater {dto.TheaterId} not found.");
            }

            var parsedTime = DateTimeHelper.ParseTimeOrThrow(dto.ShowTime, "ShowTime");

            if (existing == null)
            {
                return null;
            }

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


        public async Task<bool> DeleteAsync(long id)
        {
                
                var entity = await _db.Showtimes.FindAsync(id);
                if (entity != null)
                {
                    await _seatService.DeleteByShowtimeAsync(id);
                    _db.Showtimes.Remove(entity);
                    await _db.SaveChangesAsync();
                    return true;
                
                }
            return false;

        }


    }
}
