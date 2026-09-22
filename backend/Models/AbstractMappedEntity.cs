using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using backend.Helpers;
using backend.Helpers.Json;

namespace backend.Model
{
    public abstract class AbstractMappedEntity
    {
        [Column("created_at")]
        [JsonPropertyName("createdAt")]
        [JsonConverter(typeof(VnDateTimeJsonConverter))]
        public DateTime CreatedAt { get; set; } = DateTimeHelper.Now;

        [Column("updated_at")]
        [JsonPropertyName("updatedAt")]
        [JsonConverter(typeof(VnDateTimeJsonConverter))]
        public DateTime UpdatedAt { get; set; } = DateTimeHelper.Now;

        public void MarkCreated()
        {
            var now = DateTimeHelper.Now;
            CreatedAt = now;
            UpdatedAt = now;
        }

        public void MarkUpdated()
        {
            UpdatedAt = DateTimeHelper.Now;
        }
    }
}
