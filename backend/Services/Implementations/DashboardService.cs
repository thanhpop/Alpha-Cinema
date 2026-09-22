using backend.Data;
using backend.Helpers;
using backend.DTO.Dashboard;
using backend.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Service.Implementations
{
    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _db;

        public DashboardService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<DashboardResponseDTO> GetDashboardAsync()
        {
            var today = DateTimeHelper.Today;

        
            var totalRevenue = await _db.Reservations
                .Where(r => r.Paid)
                .SumAsync(r => (decimal?)r.TotalPrice) ?? 0;

         
            var ticketsSold = await _db.Seats
                .Where(s => s.IsReserved)
                .CountAsync();

  
            var totalShowtimes = await _db.Showtimes
    .CountAsync();

    
            var totalSeats = await _db.Showtimes.SumAsync(s => s.TotalSeats);
            var soldSeats = await _db.Showtimes
                .SumAsync(s => s.TotalSeats - s.AvailableSeats);

            double occupancyRate = totalSeats == 0
                ? 0
                : (double)soldSeats / totalSeats * 100;

    
            var last7Days = Enumerable.Range(0, 7)
                .Select(i => today.AddDays(-i))
                .OrderBy(d => d)
                .ToList();

            var revenueChart = new List<RevenueChartDTO>();

            foreach (var day in last7Days)
            {
                var revenue = await _db.Reservations
                    .Where(r => r.Paid && r.ReservationTime.Date == day)
                    .SumAsync(r => (decimal?)r.TotalPrice) ?? 0;

                revenueChart.Add(new RevenueChartDTO
                {
                    Date = day.ToString("dd/MM"),
                    Revenue = revenue
                });
            }

     
            var topMovies = await _db.Reservations
                .Where(r => r.Paid)
                .GroupBy(r => new { r.Showtime.Movie.id, r.Showtime.Movie.title, r.Showtime.Movie.poster })
                .Select(g => new TopMovieDTO
                {
                    Id = g.Key.id,
                    Title = g.Key.title!,
                    Revenue = g.Sum(x => x.TotalPrice),
                    Image = g.Key.poster
                })
                .OrderByDescending(x => x.Revenue)
                .Take(5)
                .ToListAsync();

            var theaterPerformance = await _db.Showtimes
                .Include(s => s.Theater)
                .GroupBy(s => new { s.Theater.name, s.Theater.location })
                .Select(g => new TheaterPerformanceDTO
                {
                    TheaterName = g.Key.name!,
                    Location = g.Key.location!,

                    Revenue = _db.Reservations
                        .Where(r => r.Paid && g.Select(s => s.Id).Contains(r.ShowtimeId))
                        .Sum(r => (decimal?)r.TotalPrice) ?? 0,

                    TicketsSold = g.Sum(s => s.TotalSeats - s.AvailableSeats),

                    OccupancyRate = g.Sum(s => s.TotalSeats) == 0
                        ? 0
                        : (double)g.Sum(s => s.TotalSeats - s.AvailableSeats)
                          / g.Sum(s => s.TotalSeats) * 100
                })
                .ToListAsync();

   
            var moviePerformance = await _db.Showtimes
                .Include(s => s.Movie)
                .GroupBy(s => new { s.Movie.id, s.Movie.title })
                .Select(g => new MoviePerformanceDTO
                {
                    MovieName = g.Key.title!,
                    Showtimes = g.Count(),
                    TicketsSold = g.Sum(s => s.TotalSeats - s.AvailableSeats),
                    Revenue = g.Sum(s =>
                        (s.TotalSeats - s.AvailableSeats) * s.Price)
                })
                .ToListAsync();

            return new DashboardResponseDTO
            {
                Summary = new SummaryDTO
                {
                    TotalRevenue = totalRevenue, 
                    TicketsSold = ticketsSold,
                    TotalShowtimes = totalShowtimes,
                    OccupancyRate = occupancyRate
                },
                RevenueChart = revenueChart,
                TopMovies = topMovies,
                TheaterPerformance = theaterPerformance,
                MoviePerformance = moviePerformance
            };
        }
    }
}