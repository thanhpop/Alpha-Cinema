using backend.Service.Implementations;
using backend.Service.Interfaces;
using backend.Service.Vnpay;
using backend.Services.Implementations;
using backend.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<ITheaterService, TheaterService>();
            services.AddScoped<IMovieService, MovieService>();
            services.AddScoped<ISeatService, SeatService>();
            services.AddScoped<IShowtimeService, ShowtimeService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IVnPayService, VnPayService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IReservationService, ReservationService>();
            services.AddScoped<IBannerService, BannerService>();
            services.AddScoped<IArticlesService, ArticleService>();
            services.AddScoped<SeatSessionService>();
            services.AddSingleton<SeatEventService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IDashboardReportService, DashboardReportService>();
            return services;
        }
    }
}
