using backend.DTO.Common;
using System.Linq.Expressions;
using backend.Data;
using backend.Helpers;
using backend.DTO.Reservation;
using backend.DTO.Seat;
using backend.Exceptions;
using backend.Model;
using backend.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Service.Implementations
{
    public class ReservationService : IReservationService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ReservationService> _log;
        private readonly SeatSessionService _seatSessionService;

        public ReservationService(AppDbContext db, ILogger<ReservationService> log, SeatSessionService seatSessionService)
        {
            _db = db;
            _log = log;
            _seatSessionService = seatSessionService;
        }
        private static string GenerateHexId()
        {
            long time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            string hexTime = time.ToString("X");

            string random = Random.Shared.Next(0, int.MaxValue).ToString("X");

            return $"{hexTime}{random}";
        }

        private static readonly Expression<Func<Reservation, ReservationDto>> ToDtoExpression = r => new ReservationDto
        {
            Id = r.Id,
            UserId = r.UserId,
            ShowtimeId = r.ShowtimeId,
            ReservationTime = r.ReservationTime,
            ShowDate = r.Showtime.ShowDate,
            ShowTimeValue = r.Showtime.ShowTime,
            MovieName = r.Showtime.Movie.title,
            TheaterName = r.Showtime.Theater.name,
            StatusId = r.StatusId,
            StatusValue = MapStatus(r.StatusId),
            TotalPrice = r.TotalPrice,
            Paid = r.Paid,
            Seats = r.Seats.Select(s => new SeatDto
            {
                Id = s.Id,
                ShowtimeId = s.ShowtimeId,
                SeatNumber = s.SeatNumber,
                IsReserved = s.IsReserved
            }).ToList()
        };

        public async Task<IEnumerable<ReservationDto>> GetAllAsync()
        {
            return await _db.Reservations.AsNoTracking()
               .Select(ToDtoExpression)
               .ToListAsync();
        }

        public async Task<PagedResult<ReservationDto>> GetPagedAsync(ReservationPagedQuery query)
        {
            var q = _db.Reservations.AsNoTracking();

            if (query.FromDate.HasValue)
            {
                var from = query.FromDate.Value.Date;
                q = q.Where(r => r.ReservationTime >= from);
            }
            if (query.ToDate.HasValue)
            {
                var toExclusive = query.ToDate.Value.Date.AddDays(1);
                q = q.Where(r => r.ReservationTime < toExclusive);
            }
            if (query.MinPrice.HasValue)
                q = q.Where(r => r.TotalPrice >= query.MinPrice.Value);
            if (query.MaxPrice.HasValue)
                q = q.Where(r => r.TotalPrice <= query.MaxPrice.Value);
            if (query.Paid.HasValue)
                q = q.Where(r => r.Paid == query.Paid.Value);
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                var statusId = MapStatusId(query.Status);
                q = q.Where(r => r.StatusId == statusId);
            }
            if (query.Keyword is { } kw)
                q = q.Where(r => r.Id.Contains(kw) ||
                                 (r.Showtime.Movie.title != null && r.Showtime.Movie.title.Contains(kw)));

            return await q
                .OrderByDescending(r => r.ReservationTime)
                .Select(ToDtoExpression)
                .ToPagedResultAsync(query);
        }
        public async Task<ReservationDto> GetByIdAsync(string id)
        {
            var reservation = await _db.Reservations
        .AsNoTracking()
        .Where(r => r.Id == id)
        .Select(r => new ReservationDto
        {
            Id = r.Id,
            UserId = r.UserId,
            ShowtimeId = r.ShowtimeId,
            ReservationTime = r.ReservationTime,
            ShowDate = r.Showtime.ShowDate,
            ShowTimeValue = r.Showtime.ShowTime,
            MovieName = r.Showtime.Movie.title,
            TheaterName = r.Showtime.Theater.name,
            StatusId = r.StatusId,
            StatusValue = MapStatus(r.StatusId),
            TotalPrice = r.TotalPrice,
            Paid = r.Paid,
            Seats = r.Seats.Select(s => new SeatDto
            {
                Id = s.Id,
                ShowtimeId = s.ShowtimeId,
                SeatNumber = s.SeatNumber,
                IsReserved = s.IsReserved
            }).ToList()
        })
        .FirstOrDefaultAsync();

            return reservation ?? throw ReservationNotFound();
        }
        public async Task<ReservationDto> CreateReservationAsync(long userId, ReservationRequestDto dto)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
                throw new NotFoundException("Không tìm thấy người dùng.");

            var showtime = await _db.Showtimes.FindAsync(dto.ShowtimeId);
            if (showtime == null)
                throw new NotFoundException("Không tìm thấy suất chiếu.");

            if (dto.SeatIds == null || dto.SeatIds.Count == 0)
                throw new BadRequestException("Vui lòng chọn ít nhất một ghế.");

            await using var tx = await _db.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);


            var distinctSeatIds = dto.SeatIds.Distinct().ToList();
            if (distinctSeatIds.Count != dto.SeatIds.Count)
                throw new BadRequestException("Danh sách ghế bị trùng.");

            var idsCsv = string.Join(", ", distinctSeatIds);

            var sql = $"SELECT * FROM seat WHERE id IN ({idsCsv}) AND showtime_id = {{0}} FOR UPDATE";
            var seats = await _db.Seats
                                 .FromSqlRaw(sql, dto.ShowtimeId)
                                 .ToListAsync();

            if (seats.Count != distinctSeatIds.Count)
            {
                var foundIds = seats.Select(s => s.Id).ToHashSet();
                var notFound = distinctSeatIds.Where(id => !foundIds.Contains(id)).ToList();
                throw new NotFoundException($"Không tìm thấy ghế: {string.Join(", ", notFound)}.");
            }
            var wrong = seats.Where(s => s.ShowtimeId != dto.ShowtimeId).ToList();
            if (wrong.Any())
            {
                var wrongNums = string.Join(", ", wrong.Select(s => s.SeatNumber));
                throw new BadRequestException($"Ghế {wrongNums} không thuộc suất chiếu này.");
            }

            var alreadyReserved = seats.Where(s => s.IsReserved).ToList();
            if (alreadyReserved.Any())
            {
                var reservedNums = string.Join(", ", alreadyReserved.Select(s => s.SeatNumber));
                throw new ConflictException($"Ghế {reservedNums} đã có người đặt.");
            }

       
            var reservation = new Reservation
            {
                Id = GenerateHexId(),
                UserId = userId,
                ShowtimeId = dto.ShowtimeId,
                ReservationTime = DateTimeHelper.Now,
                StatusId = 1, 
                TotalPrice = showtime.Price * seats.Count,
                Paid = false
            };

            _db.Reservations.Add(reservation);
            await _db.SaveChangesAsync(); 


            foreach (var seat in seats)
            {
                seat.ReservationId = reservation.Id;
            }

            showtime.AvailableSeats -= seats.Count;
            _db.Showtimes.Update(showtime);

            await _db.SaveChangesAsync();

            await tx.CommitAsync();

            var reservationDto = new ReservationDto
            {
                Id = reservation.Id,
                UserId = reservation.UserId,
                ShowtimeId = reservation.ShowtimeId,
                ReservationTime = reservation.ReservationTime,
                ShowDate = showtime.ShowDate,
                ShowTimeValue = showtime.ShowTime,
                StatusId = reservation.StatusId,
                StatusValue = MapStatus(reservation.StatusId),
                TotalPrice = reservation.TotalPrice,
                Paid = reservation.Paid,

                Seats = seats.Select(s => new SeatDto
                {
                    Id = s.Id,
                     ShowtimeId = s.ShowtimeId,
                    SeatNumber = s.SeatNumber,
                    IsReserved = s.IsReserved
                }).ToList()
            };

            return reservationDto;
        }

        public async Task ConfirmReservationAsync(string reservationId)
        {
            var reservation = await _db.Reservations
    .Include(r => r.Seats)
    .FirstOrDefaultAsync(r => r.Id == reservationId);

            if (reservation == null)
                throw ReservationNotFound();

            if (reservation.StatusId == 3)
                throw new ConflictException("Không thể xác nhận đơn đặt vé đã bị hủy.");

            if (reservation.StatusId == 2 && reservation.Paid)
                return;
            foreach (var seat in reservation.Seats)
            {
                if (seat.IsReserved)
                    throw new ConflictException($"Ghế {seat.SeatNumber} đã có người đặt.");

                seat.IsReserved = true;
            }
            

            reservation.StatusId = 2; 
            reservation.Paid = true;

            _db.Reservations.Update(reservation);
            await _db.SaveChangesAsync();

            await _seatSessionService.RemoveAsync((int)reservation.ShowtimeId,  reservation.UserId);
        }


        public async Task CancelReservationAsync(string reservationId)
        {
            var reservation = await _db.Reservations.Include(r => r.Showtime)
        .Include(r => r.Seats)
        .FirstOrDefaultAsync(r => r.Id == reservationId);
            if (reservation == null)
                throw ReservationNotFound();
            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
        
                reservation.StatusId = 3;

             
                var seats = reservation.Seats;
                foreach (var seat in seats)
                {
                    if (seat.IsReserved)
                    {
                        seat.IsReserved = false;
                        reservation.Showtime.AvailableSeats += 1;
                    }

                    seat.ReservationId = null;

                }
                _db.Seats.UpdateRange(seats);

                var showtime = reservation.Showtime!; 
                showtime.AvailableSeats += seats.Count;
                _db.Showtimes.Update(showtime);

                _db.Reservations.Update(reservation);
                await _db.SaveChangesAsync();
                await tx.CommitAsync();

                await _seatSessionService.RemoveAsync(
           (int)reservation.ShowtimeId,
           reservation.UserId
       );
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }
        public async Task<PagedResult<ReservationDto>> GetReservationsByUserAsync(long userId, PagedQuery query)
        {
            var q = _db.Reservations
                .AsNoTracking()
                .Where(r => r.UserId == userId);

            if (query.Keyword is { } kw)
                q = q.Where(r => r.Id.Contains(kw) ||
                                 (r.Showtime.Movie.title != null && r.Showtime.Movie.title.Contains(kw)) ||
                                 (r.Showtime.Theater.name != null && r.Showtime.Theater.name.Contains(kw)));

            return await q
                .OrderByDescending(r => r.ReservationTime)
                .Select(ToDtoExpression)
                .ToPagedResultAsync(query);
        }

        public async Task<UserReservationSummaryDto> GetUserSummaryAsync(long userId)
        {
            var confirmedId = MapStatusId("CONFIRMED");
            var confirmed = _db.Reservations
                .AsNoTracking()
                .Where(r => r.UserId == userId && r.StatusId == confirmedId);

            return new UserReservationSummaryDto
            {
                TotalTickets = await confirmed.SelectMany(r => r.Seats).CountAsync(),
                TotalSpent = await confirmed.SumAsync(r => (decimal?)r.TotalPrice) ?? 0
            };
        }
        public async Task DeleteAsync(string id)
        {
            var reservation = await _db.Reservations.FindAsync(id) ?? throw ReservationNotFound();

                var show = await _db.Showtimes.FindAsync(reservation.ShowtimeId);
                if (show != null)
                {
                    show.AvailableSeats += 1;
                    _db.Showtimes.Update(show);
                }

                _db.Reservations.Remove(reservation);
                await _db.SaveChangesAsync();
        }

        private static NotFoundException ReservationNotFound() => new("Không tìm thấy đơn đặt vé.");

        private static string MapStatus(int statusId)
        {
            return statusId switch
            {
                1 => "PENDING",
                2 => "CONFIRMED",
                3 => "CANCELED",
                _ => "UNKNOWN"
            };
        }

        private static int MapStatusId(string status)
        {
            return status.Trim().ToUpperInvariant() switch
            {
                "PENDING" => 1,
                "CONFIRMED" => 2,
                "CANCELED" => 3,
                _ => 0
            };
        }
    }

}
