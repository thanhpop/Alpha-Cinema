using System.Text.Json.Serialization;

namespace backend.DTO.Auth
{
    public class RefreshTokenResponseDto
    {
        public string AccessToken { get; set; } = null!;

        // Refresh token mới sau khi rotate, gửi qua cookie HttpOnly.
        // null khi không rotate (race giữa nhiều tab) thì giữ nguyên cookie hiện tại.
        [JsonIgnore]
        public string? RefreshToken { get; set; }

        [JsonIgnore]
        public DateTime RefreshTokenExpiresAt { get; set; }
    }
}
