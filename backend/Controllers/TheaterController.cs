using backend.DTO.Common;
using backend.DTO.Theater;
using backend.Helpers;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TheaterController : ControllerBase
    {
        private readonly ITheaterService _service;
        private readonly ILogger<TheaterController> _logger;

        public TheaterController(ITheaterService service, ILogger<TheaterController> logger)
        {
            _service = service;
            _logger = logger;
        }
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _service.GetAllAsync();
            return Ok(ApiResponse<IEnumerable<TheaterDto>>.Success(data));
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged([FromQuery] PagedQuery query)
        {
            var data = await _service.GetPagedAsync(query);
            return Ok(ApiResponse<PagedResult<TheaterDto>>.Success(data));
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(long id)
        {
            var item = await _service.GetByIdAsync(id);
            if (item == null)
                return NotFound(ApiResponse<TheaterDto>.Fail("Not found", 404));

            return Ok(ApiResponse<TheaterDto>.Success(item));
        }
        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<IActionResult> GetByLocation([FromQuery] string location)
        {
            var data = await _service.GetByLocationAsync(location);
            return Ok(ApiResponse<IEnumerable<TheaterDto>>.Success(data));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TheaterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(Get),
                new { id = created.Id },
                ApiResponse<TheaterDto>.Success(created, "Created", 201));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] TheaterDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(ApiResponse<TheaterDto>.Fail("Not found", 404));

            return Ok(ApiResponse<TheaterDto>.Success(updated, "Updated successfully"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var ok = await _service.DeleteAsync(id);
            if (!ok) return NotFound();

            return NoContent();
        }
    }
}
