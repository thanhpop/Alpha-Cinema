using System.ComponentModel.DataAnnotations;

namespace backend.DTO.Auth
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Vui lòng nhập tên đăng nhập.")]
        public string? Username { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        public string? Password { get; set; }
    }
}
