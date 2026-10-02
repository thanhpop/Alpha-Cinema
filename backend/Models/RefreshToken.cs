using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Model
{
    public class RefreshToken
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("user_id")]
        public long UserId { get; set; }

        [Required]
        [Column("token")]
        public string Token { get; set; } = null!;

        [Column("expiry_date")]
        public DateTime ExpiryDate { get; set; }

        // Các token sinh ra từ cùng một lần đăng nhập (qua các lần rotate) có chung FamilyId
        [Required]
        [Column("family_id")]
        public string FamilyId { get; set; } = null!;

        // Thời điểm token bị thay bằng token mới khi rotate; null = token đang dùng được
        [Column("revoked_at")]
        public DateTime? RevokedAt { get; set; }

        [Column("replaced_by_token")]
        public string? ReplacedByToken { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}
