using backend.DTO.Common;
using backend.DTO.Movie;
using backend.Helpers;
using backend.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MovieController : ControllerBase
    {
        private readonly IMovieService _service;

        public MovieController(IMovieService service)
        {
            _service = service;
        }
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _service.GetAllAsync();
            return Ok(ApiResponse<IEnumerable<MovieDto>>.Success(data));
        }

        [AllowAnonymous]
        [HttpGet("now-showing")]
        public async Task<IActionResult> GetNowShowing()
        {
            var data = await _service.GetNowShowingAsync();
            return Ok(ApiResponse<IEnumerable<ShowingMovieDto>>.Success(data));
        }

        [AllowAnonymous]
        [HttpGet("coming-soon")]
        public async Task<IActionResult> GetComingSoon()
        {
            var data = await _service.GetComingSoonAsync();
            return Ok(ApiResponse<IEnumerable<ShowingMovieDto>>.Success(data));
        }

        [HttpGet("paged")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetPaged([FromQuery] PagedQuery query)
        {
            var data = await _service.GetPagedAsync(query);
            return Ok(ApiResponse<PagedResult<MovieDto>>.Success(data));
        }
        [AllowAnonymous]
        [HttpGet("{id:long}")]
        public async Task<IActionResult> Get(long id)
        {
            var movie = await _service.GetByIdAsync(id);
            return Ok(ApiResponse<MovieDto>.Success(movie));
        }

        [HttpPost]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Create([FromBody] MovieDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return Ok(ApiResponse<MovieDto>.Success(created));
        }

        [HttpPut("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Update(long id, [FromBody] MovieDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            return Ok(ApiResponse<MovieDto>.Success(updated));
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Delete(long id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
