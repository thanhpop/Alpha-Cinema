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
        public async Task<IActionResult> GetAll()
        {
            var users = await _service.GetAllAsync();
            return Ok(ApiResponse<IEnumerable<UserDto>>.Success(users));
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged([FromQuery] PagedQuery query)
        {
            var data = await _service.GetPagedAsync(query);
            return Ok(ApiResponse<PagedResult<UserDto>>.Success(data));
        }


        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized(ApiResponse<string>.Fail("Invalid token", 401));

            var profile = await _service.GetProfileAsync(userId.Value);
            if (profile == null) return NotFound(ApiResponse<string>.Fail("User not found", 404));
            return Ok(ApiResponse<UserProfileDto>.Success(profile));
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile(UpdateProfileDto dto)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized(ApiResponse<string>.Fail("Invalid token", 401));

            var profile = await _service.UpdateProfileAsync(userId.Value, dto);
            if (profile == null) return NotFound(ApiResponse<string>.Fail("User not found", 404));
            return Ok(ApiResponse<UserProfileDto>.Success(profile, "Cập nhật thông tin thành công"));
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var user = await _service.GetByIdAsync(id);
            if (user == null) return NotFound(new { code = 404, message = "User not found" });
            return Ok(ApiResponse<UserDto>.Success(user));
        }


        [HttpDelete("{id:long}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<IActionResult> Delete(long id)
        {

                var ok = await _service.DeleteAsync(id);
                if (!ok) return NotFound(new { code = 404, message = "User not found" });
                return NoContent(); 
     
        }
    }
}
