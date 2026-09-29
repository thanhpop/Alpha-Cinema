using backend.DTO.Common;
using backend.DTO.Banner;

namespace backend.Service.Interfaces
{
    public interface IBannerService
    {
        Task<List<BannerDto>> GetActiveBannersAsync();

        Task<List<BannerDto>> GetAllAsync();
        Task<PagedResult<BannerDto>> GetPagedAsync(PagedQuery query);
        Task<BannerDto> CreateAsync(BannerDto dto);
        Task<BannerDto> UpdateAsync(int id, BannerDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
