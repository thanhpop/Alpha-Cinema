using backend.DTO.Common;
using backend.DTO.Articles;

namespace backend.Service.Interfaces
{
    public interface IArticlesService
    {
        Task<List<ArticlesDto>> GetAllAsync();
        Task<PagedResult<ArticlesDto>> GetPagedAsync(PagedQuery query);
        Task<List<ArticlesDto>> GetActiveAsync();
        Task<ArticlesDto?> GetByIdAsync(int id);
        Task<ArticlesDto> CreateAsync(ArticlesDto dto);
        Task<ArticlesDto?> UpdateAsync(int id, ArticlesDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
