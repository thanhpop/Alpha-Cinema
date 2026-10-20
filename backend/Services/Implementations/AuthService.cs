using backend.Data;
using backend.DTO.Auth;
using backend.Exceptions;
using backend.Model;
using backend.Service.Interfaces;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Org.BouncyCastle.Crypto.Generators;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using StackExchange.Redis;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using static Org.BouncyCastle.Crypto.Engines.SM2Engine;
using static Org.BouncyCastle.Math.EC.ECCurve;

namespace backend.Service.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly ILogger<AuthService> _logger;
        private readonly IDatabase _redis;
        private readonly IEmailService _email;
        private readonly int _refreshTokenDays = 7;
        private readonly TimeSpan _refreshReuseGrace = TimeSpan.FromSeconds(30);
        private readonly TimeSpan _resetTokenLifetime = TimeSpan.FromMinutes(15);
        private readonly TimeSpan _resetRequestCooldown = TimeSpan.FromSeconds(60);
        public AuthService(AppDbContext db, IConfiguration config, ILogger<AuthService> logger,
            IConnectionMultiplexer redis, IEmailService email)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _config = config ?? throw new ArgumentNullException(nameof(config));
            _logger = logger;
            _redis = redis.GetDatabase();
            _email = email;
        }


        public async Task<long> RegisterAsync(RegisterDto dto)
        {
            var username = dto.Username?.Trim();
            var email = dto.Email?.Trim().ToLowerInvariant();
            var existing = await _db.Set<User>().AsNoTracking()
                .Where(u => u.username == username || u.email == email)
                .Select(u => u.username)
                .ToListAsync();
            if (existing.Any(name => string.Equals(name, username, StringComparison.OrdinalIgnoreCase)))
                throw new ConflictException("Tên đăng nhập đã tồn tại.");
            if (existing.Count > 0)
                throw new ConflictException("Email đã được sử dụng.");

            var hashed = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            var defaultRole = await _db.Roles.FirstOrDefaultAsync(r => r.name == "USER");
            if (defaultRole == null)
                throw new Exception("Không tìm thấy vai trò mặc định USER.");

            var user = new User
            {
                username = username,
                email = email,
                password = hashed,
                role_id = defaultRole.id
            };
            _db.Set<User>().Add(user);
            await _db.SaveChangesAsync();
            return user.id;
        }
        public async Task<JwtResponseDto> LoginAsync(LoginDto dto)
        {
            var invalidCredentials = new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không đúng.");

            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                throw invalidCredentials;

            var user = await _db.Set<User>()
                .Include(u => u.Role)
        .FirstOrDefaultAsync(u => u.username == dto.Username);

            if (user == null) throw invalidCredentials;

            var ok = BCrypt.Net.BCrypt.Verify(dto.Password, user.password ?? string.Empty);
            if (!ok) throw invalidCredentials;


            var (token, expire) = CreateJwtToken(user);

            var now = DateTime.UtcNow;

            await _db.RefreshTokens
                .Where(r => r.UserId == user.id && r.ExpiryDate < now)
                .ExecuteDeleteAsync();

            var refreshToken = GenerateSecureToken();
            var refreshEntity = new RefreshToken
            {
                UserId = user.id,
                Token = HashToken(refreshToken),
                FamilyId = Guid.NewGuid().ToString("N"),
                ExpiryDate = now.AddDays(_refreshTokenDays),
                CreatedAt = now,
                UpdatedAt = now
            };

            _db.RefreshTokens.Add(refreshEntity);
            await _db.SaveChangesAsync();

            var dtoResp = new JwtResponseDto
            {
                AccessToken = token,
                UserId = user.id,
                Username = user.username,
                Email = user.email,
                RefreshToken = refreshToken,
                RefreshTokenExpiresAt = refreshEntity.ExpiryDate,
                Role = user.Role?.name ?? string.Empty
            };

            return dtoResp;

        }
        private string GenerateSecureToken(int size = 64)
        {
            var bytes = new byte[size];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Base64UrlEncoder.Encode(bytes);
        }

        private static string HashToken(string token) =>
            Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        public async Task<RefreshTokenResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken)) return null;

            var tokenHash = HashToken(refreshToken);
            var current = await _db.RefreshTokens
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Token == tokenHash);

            if (current == null) return null;

            var now = DateTime.UtcNow;

            if (current.ExpiryDate < now)
            {
                await DeleteFamilyAsync(current.FamilyId);
                return null;
            }

            var user = await _db.Users
                .AsNoTracking()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.id == current.UserId);
            if (user == null) return null;

            if (current.RevokedAt != null)
                return await HandleRotatedTokenAsync(current, user, now);

            var newToken = GenerateSecureToken();
            var newTokenHash = HashToken(newToken);

            await using var tx = await _db.Database.BeginTransactionAsync();

            var rotated = await _db.RefreshTokens
                .Where(r => r.Id == current.Id && r.RevokedAt == null)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(r => r.RevokedAt, now)
                    .SetProperty(r => r.ReplacedByToken, newTokenHash)
                    .SetProperty(r => r.UpdatedAt, now));

            if (rotated == 0)
            {
                await tx.RollbackAsync();
                var latest = await _db.RefreshTokens
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == current.Id);
                return latest == null ? null : await HandleRotatedTokenAsync(latest, user, now);
            }

            _db.RefreshTokens.Add(new RefreshToken
            {
                UserId = current.UserId,
                Token = newTokenHash,
                FamilyId = current.FamilyId,
                ExpiryDate = current.ExpiryDate,
                CreatedAt = now,
                UpdatedAt = now
            });
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            return new RefreshTokenResponseDto
            {
                AccessToken = CreateJwtToken(user).token,
                RefreshToken = newToken,
                RefreshTokenExpiresAt = current.ExpiryDate
            };
        }

        private async Task<RefreshTokenResponseDto?> HandleRotatedTokenAsync(RefreshToken token, User user, DateTime now)
        {
            var withinGrace = token.ReplacedByToken != null
                && token.RevokedAt.HasValue
                && now - token.RevokedAt.Value <= _refreshReuseGrace;

            if (withinGrace)
                return new RefreshTokenResponseDto { AccessToken = CreateJwtToken(user).token };

            _logger.LogWarning(
                "Refresh token reuse detected for user {UserId}, revoking token family {FamilyId}",
                token.UserId, token.FamilyId);
            await DeleteFamilyAsync(token.FamilyId);
            return null;
        }

        private Task<int> DeleteFamilyAsync(string familyId) =>
            _db.RefreshTokens.Where(r => r.FamilyId == familyId).ExecuteDeleteAsync();


        private (string token, DateTime expires) CreateJwtToken(User user)
        {

            var secret = Environment.GetEnvironmentVariable("JWT_KEY")
                 ?? _config["Jwt:Key"];

            var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
                         ?? _config["Jwt:Issuer"];

            var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                           ?? _config["Jwt:Audience"];
            var expireString = Environment.GetEnvironmentVariable("JWT_EXPIRE_MINUTES");

            int expireMinutes = int.Parse(expireString ?? "60");

            if (string.IsNullOrWhiteSpace(secret))
                throw new InvalidOperationException("JWT secret is not configured  in .env.");


            byte[] keyBytes;
            try
            {
                keyBytes = Convert.FromBase64String(secret);
            }
            catch (FormatException)
            {
                keyBytes = Encoding.UTF8.GetBytes(secret);
            }

            if (keyBytes.Length < 32) 
                throw new InvalidOperationException("JWT key too short. It must be at least 256 bits (32 bytes). Use a longer secret or a base64-encoded 32-byte key.");

            var symmetricKey = new SymmetricSecurityKey(keyBytes);
            var credentials = new SigningCredentials(symmetricKey, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.username ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };
            if (user.Role?.name is string roleName)
            {
                claims.Add(new Claim(ClaimTypes.Role, roleName));
            }
            var expires = DateTime.UtcNow.AddMinutes(expireMinutes);

            var jwt = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expires,
                signingCredentials: credentials
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(jwt);
            return (tokenString, expires);
        }
        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken)) return false;

            var tokenHash = HashToken(refreshToken);
            var refresh = await _db.RefreshTokens
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Token == tokenHash);
            if (refresh == null) return false;

            await DeleteFamilyAsync(refresh.FamilyId);
            return true;
        }

        private static string ResetTokenKey(string tokenHash) => $"password-reset:token:{tokenHash}";
        private static string ResetUserKey(long userId) => $"password-reset:user:{userId}";
        private static string ResetCooldownKey(string email) => $"password-reset:cooldown:{email}";

        public async Task ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var email = dto.Email!.Trim().ToLowerInvariant();

            // Giới hạn theo email (kể cả email không tồn tại) để không lộ email nào đã đăng ký
            if (!await _redis.StringSetAsync(ResetCooldownKey(email), 1, _resetRequestCooldown, When.NotExists))
                throw new BadRequestException($"Vui lòng đợi {_resetRequestCooldown.TotalSeconds} giây trước khi gửi lại yêu cầu.");

            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.email == email);
            if (user == null) return;

            var token = GenerateSecureToken(32);
            var tokenHash = HashToken(token);

            var userKey = ResetUserKey(user.id);
            var previousHash = await _redis.StringGetAsync(userKey);
            if (!previousHash.IsNullOrEmpty)
                await _redis.KeyDeleteAsync(ResetTokenKey(previousHash!));

            await _redis.StringSetAsync(ResetTokenKey(tokenHash), user.id, _resetTokenLifetime);
            await _redis.StringSetAsync(userKey, tokenHash, _resetTokenLifetime);

            var frontendUrl = (Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost:4200").TrimEnd('/');
            var resetLink = $"{frontendUrl}/reset-password?token={token}";

            await _email.SendAsync(user.email!, "Đặt lại mật khẩu", $"""
                <p>Xin chào <b>{WebUtility.HtmlEncode(user.username)}</b>,</p>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Bấm vào nút dưới đây để đặt mật khẩu mới:</p>
                <p><a href="{resetLink}" style="display:inline-block;padding:12px 24px;background:#258dcf;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Đặt lại mật khẩu</a></p>
                <p>Liên kết có hiệu lực trong {_resetTokenLifetime.TotalMinutes} phút và chỉ dùng được một lần.</p>
                <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
                """);
        }

        public async Task ResetPasswordAsync(ResetPasswordDto dto)
        {
            var invalidToken = new BadRequestException("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");

            var tokenKey = ResetTokenKey(HashToken(dto.Token!));
            var userIdValue = await _redis.StringGetAsync(tokenKey);

            if (userIdValue.IsNullOrEmpty || !await _redis.KeyDeleteAsync(tokenKey))
                throw invalidToken;

            var userId = (long)userIdValue;
            var user = await _db.Users.FirstOrDefaultAsync(u => u.id == userId) ?? throw invalidToken;

            user.password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _db.SaveChangesAsync();

            await _redis.KeyDeleteAsync(ResetUserKey(userId));
            await _db.RefreshTokens.Where(r => r.UserId == userId).ExecuteDeleteAsync();
        }

        public async Task ChangePasswordAsync(long userId, ChangePasswordDto dto, string? currentRefreshToken)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.id == userId)
                ?? throw new NotFoundException("Không tìm thấy người dùng.");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.password ?? string.Empty))
                throw new BadRequestException("Mật khẩu hiện tại không đúng.");

            user.password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _db.SaveChangesAsync();

            string? currentFamilyId = null;
            if (!string.IsNullOrWhiteSpace(currentRefreshToken))
            {
                var tokenHash = HashToken(currentRefreshToken);
                currentFamilyId = await _db.RefreshTokens
                    .Where(r => r.Token == tokenHash && r.UserId == userId)
                    .Select(r => r.FamilyId)
                    .FirstOrDefaultAsync();
            }

            await _db.RefreshTokens
                .Where(r => r.UserId == userId && r.FamilyId != currentFamilyId)
                .ExecuteDeleteAsync();
        }

    }
}
