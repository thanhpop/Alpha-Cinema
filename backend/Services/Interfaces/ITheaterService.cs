using backend.DTO.Common;
using backend.DTO.Theater;
using backend.Model;

namespace backend.Services.Interfaces
{
    public interface ITheaterService
    {
        Task<IEnumerable<TheaterDto>> GetAllAsync();
        Task<PagedResult<TheaterDto>> GetPagedAsync(PagedQuery query);
        Task<TheaterDto?> GetByIdAsync(long id);
        Task<IEnumerable<TheaterDto>> GetByLocationAsync(string location);
        Task<TheaterDto> CreateAsync(TheaterDto dto);
        Task<TheaterDto?> UpdateAsync(long id, TheaterDto dto);
        Task<bool> DeleteAsync(long id);
    }
}
