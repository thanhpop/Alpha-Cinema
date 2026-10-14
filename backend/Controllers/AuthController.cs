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
            await _auth.RegisterAsync(dto);
            return Ok(ApiResponse<RegisterDto>.Success(dto));
        }
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var auth = await _auth.LoginAsync(dto);

            Response.Cookies.Append(RefreshCookieName, auth.RefreshToken!,
                RefreshCookieOptions(auth.RefreshTokenExpiresAt));

            return Ok(ApiResponse<JwtResponseDto>.Success(auth));
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies[RefreshCookieName];
            var res = refreshToken == null ? null : await _auth.RefreshTokenAsync(refreshToken);
            if (res == null)
            {
                Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());
                return Unauthorized(ApiResponse<object>.Fail("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", StatusCodes.Status401Unauthorized));
            }

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
            SameSite = Request.IsHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/api/auth",
            Expires = expiresUtc.HasValue
                ? new DateTimeOffset(DateTime.SpecifyKind(expiresUtc.Value, DateTimeKind.Utc))
                : null
        };
    }
}
