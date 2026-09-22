using System.Globalization;

namespace backend.Helpers
{

    public static class DateTimeHelper
    {
        public const string DateFormat = "dd/MM/yyyy";
        public const string TimeFormat = "HH:mm";
        public const string DateTimeFormat = "dd/MM/yyyy HH:mm";
        public const string IsoDateFormat = "yyyy-MM-dd";
        public const string IsoDateTimeFormat = "yyyy-MM-dd'T'HH:mm:ss";

        private static readonly string[] AcceptedFormats =
        {
            "dd/MM/yyyy HH:mm:ss",
            "dd/MM/yyyy HH:mm",
            "dd/MM/yyyy",
            "d/M/yyyy",
            "dd-MM-yyyy",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm:ss.fffK",
            "yyyy-MM-dd'T'HH:mm:ssK",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd'T'HH:mm",
            "yyyy-MM-dd",
            "yyyy/MM/dd"
        };

        public static readonly TimeZoneInfo VietnamTimeZone = ResolveVietnamTimeZone();

        public static DateTime Now =>
            TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);

        public static DateTime Today => Now.Date;

        public static DateTime ToVietnamTime(DateTime value) => value.Kind switch
        {
            DateTimeKind.Utc => TimeZoneInfo.ConvertTimeFromUtc(value, VietnamTimeZone),
            DateTimeKind.Local => TimeZoneInfo.ConvertTime(value, VietnamTimeZone),
            _ => value
        };

        public static string FormatDate(DateTime value) =>
            ToVietnamTime(value).ToString(DateFormat, CultureInfo.InvariantCulture);

        public static string? FormatDate(DateTime? value) =>
            value.HasValue ? FormatDate(value.Value) : null;

        public static string FormatDateTime(DateTime value) =>
            ToVietnamTime(value).ToString(DateTimeFormat, CultureInfo.InvariantCulture);

        public static string? FormatDateTime(DateTime? value) =>
            value.HasValue ? FormatDateTime(value.Value) : null;

        public static string FormatTime(TimeSpan value) =>
            $"{(int)value.TotalHours:00}:{value.Minutes:00}";

        public static string FormatIsoDate(DateTime value) =>
            ToVietnamTime(value).ToString(IsoDateFormat, CultureInfo.InvariantCulture);

        public static string? FormatIsoDate(DateTime? value) =>
            value.HasValue ? FormatIsoDate(value.Value) : null;

        public static string FormatIsoDateTime(DateTime value) =>
            ToVietnamTime(value).ToString(IsoDateTimeFormat, CultureInfo.InvariantCulture);

        public static string? FormatIsoDateTime(DateTime? value) =>
            value.HasValue ? FormatIsoDateTime(value.Value) : null;

        public static bool TryParse(string? input, out DateTime result)
        {
            result = default;
            if (string.IsNullOrWhiteSpace(input)) return false;

            var text = input.Trim();

            if (DateTime.TryParseExact(text, AcceptedFormats, CultureInfo.InvariantCulture,
                    DateTimeStyles.None, out var exact))
            {
                result = exact;
                return true;
            }

            if (DateTime.TryParse(text, CultureInfo.InvariantCulture,
                    DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var loose))
            {
                result = ToVietnamTime(DateTime.SpecifyKind(loose, DateTimeKind.Utc));
                return true;
            }

            return false;
        }

        public static DateTime ParseOrThrow(string? input, string fieldName)
        {
            if (TryParse(input, out var value)) return value;

            throw new ArgumentException(
                $"{fieldName} không hợp lệ. Định dạng hợp lệ: {DateFormat} hoặc {IsoDateFormat}.");
        }

        public static DateTime? ParseOrNull(string? input) =>
            TryParse(input, out var value) ? value : null;

        public static bool TryParseTime(string? input, out TimeSpan result)
        {
            result = default;
            if (string.IsNullOrWhiteSpace(input)) return false;

            var text = input.Trim();

            return TimeSpan.TryParseExact(text, new[] { @"hh\:mm", @"hh\:mm\:ss", @"h\:mm" },
                       CultureInfo.InvariantCulture, out result)
                   || TimeSpan.TryParse(text, CultureInfo.InvariantCulture, out result);
        }

        public static TimeSpan ParseTimeOrThrow(string? input, string fieldName)
        {
            if (TryParseTime(input, out var value)) return value;

            throw new ArgumentException($"{fieldName} phải có định dạng {TimeFormat}.");
        }

        private static TimeZoneInfo ResolveVietnamTimeZone()
        {
            foreach (var id in new[] { "SE Asia Standard Time", "Asia/Ho_Chi_Minh" })
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(id);
                }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }

            return TimeZoneInfo.CreateCustomTimeZone(
                "Asia/Ho_Chi_Minh", TimeSpan.FromHours(7), "Vietnam Time", "Vietnam Time");
        }
    }
}
