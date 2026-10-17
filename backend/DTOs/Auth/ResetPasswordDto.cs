using System.ComponentModel.DataAnnotations;

namespace backend.DTO.Auth
{
    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "Liên kết đặt lại mật khẩu không hợp lệ.")]
        public string? Token { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải từ 6 đến 100 ký tự.")]
        public string? NewPassword { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập lại mật khẩu mới.")]
        [Compare(nameof(NewPassword), ErrorMessage = "Mật khẩu xác nhận không khớp.")]
        public string? ConfirmPassword { get; set; }
    }
}
