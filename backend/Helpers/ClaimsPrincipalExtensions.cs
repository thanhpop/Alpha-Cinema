using backend.Exceptions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.Helpers
{
    public static class ClaimsPrincipalExtensions
    {
        public static long? GetUserId(this ClaimsPrincipal user)
        {
            var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return long.TryParse(value, out var id) ? id : null;
        }

        public static long GetRequiredUserId(this ClaimsPrincipal user) =>
            user.GetUserId() ?? throw new UnauthorizedException("Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.");
    }
}
