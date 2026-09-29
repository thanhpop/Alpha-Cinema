using backend.DTO.Common;
using backend.DTO.Reservation;
using backend.Model;

namespace backend.Service.Interfaces
{
    public interface IReservationService
    {
        Task<IEnumerable<ReservationDto>> GetAllAsync();
        Task<PagedResult<ReservationDto>> GetPagedAsync(ReservationPagedQuery query);
        Task<ReservationDto?> GetByIdAsync(string id);
        Task<ReservationDto?> CreateReservationAsync(long userId, ReservationRequestDto dto);

        Task<bool> CancelReservationAsync(string reservationId);

        Task<bool> ConfirmReservationAsync(string reservationId);

        Task<PagedResult<ReservationDto>> GetReservationsByUserAsync(long userId, PagedQuery query);
        Task<UserReservationSummaryDto> GetUserSummaryAsync(long userId);
        Task<bool> DeleteAsync(string id);

    }
}
