using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace backend.Helpers
{
    public static class ClaimsPrincipalExtensions
    {
        // Token lưu user id ở claim "sub"; JwtBearer có thể map nó sang NameIdentifier
        public static long? GetUserId(this ClaimsPrincipal user)
        {
            var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return long.TryParse(value, out var id) ? id : null;
        }
    }
}
