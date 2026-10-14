using backend.DTO.Common;
using backend.DTO.User;
using backend.Helpers;
using backend.Model;
using backend.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controller
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _service;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUserService service, ILogger<UsersController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetAll()
        {
            var users = await _service.GetAllAsync();
            return Ok(ApiResponse<IEnumerable<UserDto>>.Success(users));
        }

        [HttpGet("paged")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetPaged([FromQuery] PagedQuery query)
        {
            var data = await _service.GetPagedAsync(query);
            return Ok(ApiResponse<PagedResult<UserDto>>.Success(data));
        }


        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var profile = await _service.GetProfileAsync(User.GetRequiredUserId());
            return Ok(ApiResponse<UserProfileDto>.Success(profile));
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile(UpdateProfileDto dto)
        {
            var profile = await _service.UpdateProfileAsync(User.GetRequiredUserId(), dto);
            return Ok(ApiResponse<UserProfileDto>.Success(profile, "Cập nhật thông tin thành công"));
        }

        [HttpGet("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> GetById(long id)
        {
            var user = await _service.GetByIdAsync(id);
            return Ok(ApiResponse<UserDto>.Success(user));
        }

        [HttpPut("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Update(long id, AdminUpdateUserDto dto)
        {
            var user = await _service.UpdateAsync(id, dto);
            return Ok(ApiResponse<UserDto>.Success(user, "Cập nhật người dùng thành công"));
        }

        [HttpDelete("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Delete(long id)
        {
            await _service.DeleteAsync(id, User.GetRequiredUserId());
            return NoContent();
        }
    }
}
