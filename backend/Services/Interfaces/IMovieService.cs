using backend.DTO.Common;
using backend.DTO.Movie;

public interface IMovieService
{
    Task<IEnumerable<MovieDto>> GetAllAsync();
    Task<PagedResult<MovieDto>> GetPagedAsync(PagedQuery query);
    Task<IEnumerable<ShowingMovieDto>> GetNowShowingAsync();
    Task<IEnumerable<ShowingMovieDto>> GetComingSoonAsync();
    Task<MovieDto> GetByIdAsync(long id);
    Task<MovieDto> CreateAsync(MovieDto dto);
    Task<MovieDto> UpdateAsync(long id, MovieDto dto);
    Task DeleteAsync(long id);
}
