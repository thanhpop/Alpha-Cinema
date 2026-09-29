using backend.DTO.Common;
using backend.DTO.Banner;
using backend.Helpers;
using backend.Model;
using backend.Service.Implementations;
using backend.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controller
{
    [Authorize]
    [ApiController]
    [Route("api/banners")]
    public class BannersController : ControllerBase
    {
        private readonly IBannerService _service;

        public BannersController(IBannerService service)
        {
            _service = service;
        }
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _service.GetAllAsync();
            return Ok(ApiResponse<List<BannerDto>>.Success(data));
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged([FromQuery] PagedQuery query)
        {
            var data = await _service.GetPagedAsync(query);
            return Ok(ApiResponse<PagedResult<BannerDto>>.Success(data));
        }
        [AllowAnonymous]
        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var banners = await _service.GetActiveBannersAsync();
            return Ok(ApiResponse<List<BannerDto>>.Success(banners));
        }

        [HttpPost]
        public async Task<IActionResult> Create(BannerDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return Ok(ApiResponse<BannerDto>.Success(result, "Created banner successfully"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BannerDto dto)
        {
            var updatedBanner = await _service.UpdateAsync(id, dto);
            if (updatedBanner == null)
                return NotFound(ApiResponse<string>.Fail("Banner not found", 404));

            return Ok(ApiResponse<BannerDto>.Success(
                updatedBanner,
                "Updated banner successfully"
            ));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _service.DeleteAsync(id);
            if (!success)
                return NotFound(ApiResponse<string>.Fail("Banner not found", 404));

            return Ok(ApiResponse<string>.Success(null, "Deleted banner successfully"));
        }
    }
}
