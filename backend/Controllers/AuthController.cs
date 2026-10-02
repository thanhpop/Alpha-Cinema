using backend.DTO.Auth;
using backend.Helpers;
using backend.Service.Implementations;
using backend.Service.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _auth;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService auth, ILogger<AuthController> logger)
        {
            _auth = auth;
            _logger = logger;
        }
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var result = await _auth.RegisterAsync(dto);
            if(result > 0)
            {
                return Ok(ApiResponse<RegisterDto>.Success(dto));
            }
            return BadRequest();
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var auth = await _auth.LoginAsync(dto);
            if (auth == null) return NotFound(ApiResponse<object>.Fail("Invalid username/email or password"));

            Response.Cookies.Append(RefreshCookieName, auth.RefreshToken!,
                RefreshCookieOptions(auth.RefreshTokenExpiresAt));

            return Ok(ApiResponse<JwtResponseDto>.Success(auth));
        }

        // Refresh token đọc từ cookie HttpOnly; frontend giữ access token trong bộ nhớ và gọi lại endpoint này sau khi F5
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies[RefreshCookieName];
            var res = refreshToken == null ? null : await _auth.RefreshTokenAsync(refreshToken);
            if (res == null)
            {
                Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());
                return Unauthorized(new { message = "Invalid or expired refresh token" });
            }

            // Token đã được rotate: ghi đè cookie bằng refresh token mới
            if (res.RefreshToken != null)
            {
                Response.Cookies.Append(RefreshCookieName, res.RefreshToken,
                    RefreshCookieOptions(res.RefreshTokenExpiresAt));
            }

            return Ok(ApiResponse<RefreshTokenResponseDto>.Success(res));
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies[RefreshCookieName];
            if (refreshToken != null)
                await _auth.RevokeRefreshTokenAsync(refreshToken);

            Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());
            return NoContent();
        }

        private const string RefreshCookieName = "refreshToken";

        private CookieOptions RefreshCookieOptions(DateTime? expiresUtc = null) => new()
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            // HTTPS: frontend và API có thể khác site nên cần None (bắt buộc đi kèm Secure); HTTP khi dev dùng Lax
            SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
            // Chỉ gửi cookie cho các endpoint auth
            Path = "/api/auth",
            Expires = expiresUtc.HasValue
                ? new DateTimeOffset(DateTime.SpecifyKind(expiresUtc.Value, DateTimeKind.Utc))
                : null
        };
    }
}
