using backend.Data;
using backend.DTO.Auth;
using backend.Model;
using backend.Service.Interfaces;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Org.BouncyCastle.Crypto.Generators;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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
        private readonly int _refreshTokenDays = 7;
        // Token vừa bị rotate vẫn được chấp nhận trong khoảng này (nhiều tab refresh cùng lúc)
        private readonly TimeSpan _refreshReuseGrace = TimeSpan.FromSeconds(30);
        public AuthService(AppDbContext db, IConfiguration config, ILogger<AuthService> logger)
        {
            _db = db ?? throw new ArgumentNullException(nameof(db));
            _config = config ?? throw new ArgumentNullException(nameof(config));
            _logger = logger;
        }


        public async Task<long> RegisterAsync(RegisterDto dto)
        {
            var username = dto.Username?.Trim();
            var email = dto.Email?.Trim().ToLowerInvariant();
            var exists = await _db.Set<User>().AsNoTracking().AnyAsync(u => u.username == username || u.email == email);
            if (exists)
            {
                throw new ArgumentException("User with the same username or email already exists.");
            }
            var hashed = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            var defaultRole = await _db.Roles.FirstOrDefaultAsync(r => r.name == "USER");
            if (defaultRole == null)
                throw new Exception("Default role 'User' not found");

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
        public async Task<JwtResponseDto?> LoginAsync(LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return null;

            var user = await _db.Set<User>()
                .Include(u => u.Role)
        .FirstOrDefaultAsync(u => u.username == dto.Username);

            if (user == null) return null;

            var ok = BCrypt.Net.BCrypt.Verify(dto.Password, user.password ?? string.Empty);
            if (!ok) return null;


            var (token, expire) = CreateJwtToken(user);

            var now = DateTime.UtcNow;

            // Dọn các phiên đã hết hạn của user (mỗi lần rotate sinh thêm 1 dòng)
            await _db.RefreshTokens
                .Where(r => r.UserId == user.id && r.ExpiryDate < now)
                .ExecuteDeleteAsync();

            var refreshToken = GenerateRefreshToken();
            var refreshEntity = new RefreshToken
            {
                UserId = user.id,
                Token = refreshToken,
                // Mỗi lần đăng nhập là một family mới
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
        private string GenerateRefreshToken(int size = 64)
        {
            var bytes = new byte[size];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Base64UrlEncoder.Encode(bytes);
        }

        // Rotate: mỗi lần refresh cấp refresh token mới và đánh dấu token cũ đã bị thay thế.
        // Token cũ bị gửi lại sau khoảng ân hạn => nghi bị đánh cắp, thu hồi cả family.
        public async Task<RefreshTokenResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken)) return null;

            var current = await _db.RefreshTokens
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            // Không còn trong DB: đã logout, family đã bị thu hồi hoặc token không hợp lệ
            if (current == null) return null;

            var now = DateTime.UtcNow;

            // Cả family dùng chung hạn tính từ lúc đăng nhập nên hết hạn cùng lúc
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

            var newToken = GenerateRefreshToken();

            await using var tx = await _db.Database.BeginTransactionAsync();

            // Chỉ cập nhật khi token vẫn còn hiệu lực để 2 request đồng thời không cùng rotate một token
            var rotated = await _db.RefreshTokens
                .Where(r => r.Id == current.Id && r.RevokedAt == null)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(r => r.RevokedAt, now)
                    .SetProperty(r => r.ReplacedByToken, newToken)
                    .SetProperty(r => r.UpdatedAt, now));

            if (rotated == 0)
            {
                // Request khác vừa rotate (hoặc logout) trước: đọc lại trạng thái mới nhất
                await tx.RollbackAsync();
                var latest = await _db.RefreshTokens
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == current.Id);
                return latest == null ? null : await HandleRotatedTokenAsync(latest, user, now);
            }

            _db.RefreshTokens.Add(new RefreshToken
            {
                UserId = current.UserId,
                Token = newToken,
                FamilyId = current.FamilyId,
                // Giữ hạn tính từ lúc đăng nhập: rotate không kéo dài phiên
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

            // Nhiều tab / request refresh cùng lúc: cookie đã được cập nhật token mới,
            // chỉ cấp access token và không rotate thêm
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

            // Chuyển sang số để dùng trong AddMinutes()
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
            if (user.Role != null)
            {
                claims.Add(new Claim(ClaimTypes.Role, user.Role.name));
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

            var refresh = await _db.RefreshTokens
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Token == refreshToken);
            if (refresh == null) return false;

            // Logout: xóa cả family (token hiện tại và các token cũ đã rotate của phiên này)
            await DeleteFamilyAsync(refresh.FamilyId);
            return true;
        }

    }
}
