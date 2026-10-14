using System.ComponentModel.DataAnnotations;

namespace backend.DTO.Theater
{
    public class TheaterDto
    {
        public long Id { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập tên rạp.")]
        public string? Name { get; set; }

        public string? Location { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập sức chứa.")]
        [Range(0, 1000, ErrorMessage = "Sức chứa phải từ 0 đến 1000 ghế.")]
        public int Capacity { get; set; }
    }
}
