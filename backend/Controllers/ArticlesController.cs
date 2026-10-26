using backend.DTO.Common;
using backend.DTO.Articles;
using backend.Helpers;
using backend.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    
    [ApiController]
    [Route("api/articles")]
    public class ArticlesController : ControllerBase
    {
        private readonly IArticlesService _service;

        public ArticlesController(IArticlesService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _service.GetAllAsync();
            return Ok(ApiResponse<List<ArticlesDto>>.Success(data));
        }

        [Authorize(Roles = "ADMIN")]
        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged([FromQuery] PagedQuery query)
        {
            var data = await _service.GetPagedAsync(query);
            return Ok(ApiResponse<PagedResult<ArticlesDto>>.Success(data));
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var data = await _service.GetActiveAsync();
            return Ok(ApiResponse<List<ArticlesDto>>.Success(data));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var article = await _service.GetByIdAsync(id);
            return Ok(ApiResponse<ArticlesDto>.Success(article));
        }
        [Authorize(Roles = "ADMIN")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ArticlesDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return Ok(ApiResponse<ArticlesDto>.Success(created, "Tạo bài viết thành công"));
        }
        [Authorize(Roles = "ADMIN")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ArticlesDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            return Ok(ApiResponse<ArticlesDto>.Success(updated, "Cập nhật thành công"));
        }
        [Authorize(Roles = "ADMIN")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return Ok(ApiResponse<object>.Success(null, "Xóa thành công"));
        }
    }
}
