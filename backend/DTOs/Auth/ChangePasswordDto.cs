using System.ComponentModel.DataAnnotations;

namespace backend.DTO.Auth
{
    public class ChangePasswordDto : IValidatableObject
    {
        [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại.")]
        public string? CurrentPassword { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải từ 6 đến 100 ký tự.")]
        public string? NewPassword { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập lại mật khẩu mới.")]
        [Compare(nameof(NewPassword), ErrorMessage = "Mật khẩu xác nhận không khớp.")]
        public string? ConfirmPassword { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (NewPassword != null && NewPassword == CurrentPassword)
                yield return new ValidationResult("Mật khẩu mới phải khác mật khẩu hiện tại.", new[] { nameof(NewPassword) });
        }
    }
}
