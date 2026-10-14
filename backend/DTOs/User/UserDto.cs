using System.Text.Json.Serialization;
using backend.Helpers;
using backend.Helpers.Json;

namespace backend.DTO.User
{
    public class UserDto
    {
        public long Id { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Gender { get; set; }

        [JsonConverter(typeof(VnNullableDateJsonConverter))]
        public DateTime? DateOfBirth { get; set; }

        public string? DateOfBirthIso => DateTimeHelper.FormatIsoDate(DateOfBirth);
    }
}
