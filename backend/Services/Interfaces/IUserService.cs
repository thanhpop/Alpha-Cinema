using backend.DTO.Common;
using backend.DTO.User;

namespace backend.Service.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<PagedResult<UserDto>> GetPagedAsync(PagedQuery query);
        Task<UserDto?> GetByIdAsync(long id);
        Task<bool> DeleteAsync(long id);
    }
}
