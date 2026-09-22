using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Helpers.Json
{
    public class VnDateJsonConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                var text = reader.GetString();
                if (DateTimeHelper.TryParse(text, out var parsed)) return parsed.Date;

                throw new JsonException($"Giá trị ngày '{text}' không hợp lệ. Định dạng hợp lệ: {DateTimeHelper.DateFormat}.");
            }

            return reader.GetDateTime().Date;
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
            => writer.WriteStringValue(DateTimeHelper.FormatDate(value));
    }

    public class VnNullableDateJsonConverter : JsonConverter<DateTime?>
    {
        private static readonly VnDateJsonConverter Inner = new();

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null) return null;
            if (reader.TokenType == JsonTokenType.String && string.IsNullOrWhiteSpace(reader.GetString())) return null;

            return Inner.Read(ref reader, typeof(DateTime), options);
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value is null) writer.WriteNullValue();
            else writer.WriteStringValue(DateTimeHelper.FormatDate(value.Value));
        }
    }

    /// <summary>
    /// Ghi ra JSON theo dd/MM/yyyy HH:mm (giờ Việt Nam), đọc vào linh hoạt.
    /// </summary>
    public class VnDateTimeJsonConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                var text = reader.GetString();
                if (DateTimeHelper.TryParse(text, out var parsed)) return parsed;

                throw new JsonException($"Giá trị thời gian '{text}' không hợp lệ. Định dạng hợp lệ: {DateTimeHelper.DateTimeFormat}.");
            }

            return reader.GetDateTime();
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
            => writer.WriteStringValue(DateTimeHelper.FormatDateTime(value));
    }

    public class VnNullableDateTimeJsonConverter : JsonConverter<DateTime?>
    {
        private static readonly VnDateTimeJsonConverter Inner = new();

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null) return null;
            if (reader.TokenType == JsonTokenType.String && string.IsNullOrWhiteSpace(reader.GetString())) return null;

            return Inner.Read(ref reader, typeof(DateTime), options);
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value is null) writer.WriteNullValue();
            else writer.WriteStringValue(DateTimeHelper.FormatDateTime(value.Value));
        }
    }
}
