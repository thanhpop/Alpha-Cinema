using backend.DTO.Common;
using backend.DTO.Movie;

public interface IMovieService
{
    Task<IEnumerable<MovieDto>> GetAllAsync();
    Task<PagedResult<MovieDto>> GetPagedAsync(PagedQuery query);
    Task<MovieDto?> GetByIdAsync(long id);
    Task<MovieDto> CreateAsync(MovieDto dto);
    Task<MovieDto?> UpdateAsync(long id, MovieDto dto);
    Task<bool> DeleteAsync(long id);
}
