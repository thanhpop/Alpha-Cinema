using System.ComponentModel.DataAnnotations;

namespace backend.DTO.User
{
    public class AdminUpdateUserDto : UpdateProfileDto
    {
        [Required(ErrorMessage = "Vui lòng nhập email.")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ.")]
        [StringLength(255, ErrorMessage = "Email tối đa 255 ký tự.")]
        public string? Email { get; set; }
    }
}
