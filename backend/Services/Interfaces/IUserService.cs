using backend.DTO.Common;
using backend.DTO.User;

namespace backend.Service.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<PagedResult<UserDto>> GetPagedAsync(PagedQuery query);
        Task<UserDto> GetByIdAsync(long id);
        Task<UserProfileDto> GetProfileAsync(long id);
        Task<UserProfileDto> UpdateProfileAsync(long id, UpdateProfileDto dto);
        Task<UserDto> UpdateAsync(long id, AdminUpdateUserDto dto);
        Task DeleteAsync(long id, long currentUserId);
    }
}
