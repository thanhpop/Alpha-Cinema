using backend.DTO.Common;
using backend.DTO.Showtime;

namespace backend.Service.Interfaces
{
    public interface IShowtimeService
    {
        Task<IEnumerable<ShowtimeDto>> GetAllAsync();
        Task<PagedResult<ShowtimeDto>> GetPagedAsync(PagedQuery query);
        Task<IEnumerable<ShowtimeDto>> GetByMovieAsync(long movieId);
        Task<IEnumerable<ShowtimeDto>> GetByTheaterAsync(long theaterId);
        Task<ShowtimeDto> GetByIdAsync(long id);

        Task<ShowtimeDto> CreateAsync(ShowtimeDto dto);
        Task<ShowtimeDto> UpdateAsync(long id, ShowtimeDto dto);
        Task DeleteAsync(long id);
    }
}
