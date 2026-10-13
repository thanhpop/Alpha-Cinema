using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using backend.Helpers;
using backend.Helpers.Json;

namespace backend.DTO.User
{
    public class UpdateProfileDto : IValidatableObject
    {
        [RegularExpression(@"^(0|\+84)\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ.")]
        public string? Phone { get; set; }

        [RegularExpression("^(male|female|other)$", ErrorMessage = "Giới tính không hợp lệ.")]
        public string? Gender { get; set; }

        [JsonConverter(typeof(VnNullableDateJsonConverter))]
        public DateTime? DateOfBirth { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (DateOfBirth > DateTimeHelper.Today)
                yield return new ValidationResult("Ngày sinh không được ở tương lai.", new[] { nameof(DateOfBirth) });
        }
    }
}
