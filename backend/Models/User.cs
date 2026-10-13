using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace backend.Model
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public long id { get; set; }
        [Column("username")]
        public string? username { get; set; }
        [Column("email")]
        public string? email { get; set; }
        [Column("password")]
        public string? password { get; set; }

        [Column("phone")]
        [MaxLength(15)]
        public string? phone { get; set; }

        [Column("gender")]
        [MaxLength(10)]
        public string? gender { get; set; }

        [Column("date_of_birth", TypeName = "date")]
        public DateTime? dateOfBirth { get; set; }

        [Column("role_id")]
        [ForeignKey("Role")]
        public long role_id { get; set; }

        public Role? Role { get; set; }


    }
}
