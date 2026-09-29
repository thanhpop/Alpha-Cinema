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

        [HttpGet("paged")]
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
            if (movie == null) return NotFound();

            return Ok(ApiResponse<MovieDto>.Success(movie));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MovieDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return Ok(ApiResponse<MovieDto>.Success(created));
        }

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] MovieDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (updated == null) return NotFound();

            return Ok(ApiResponse<MovieDto>.Success(updated));
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var ok = await _service.DeleteAsync(id);
            if (!ok) return NotFound();

            return NoContent();
        }
    }
}
