using System.Text.Json.Serialization;

namespace backend.DTO.Auth
{
    public class JwtResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public long UserId { get; set; }
        public string? Username { get; set; }

        public string? Email { get; set; }

        // Refresh token chỉ gửi qua cookie HttpOnly, không trả trong body để JS không đọc được
        [JsonIgnore]
        public string? RefreshToken { get; set; }

        [JsonIgnore]
        public DateTime RefreshTokenExpiresAt { get; set; }

        public string Role { get; set; } = string.Empty;
    }
}
