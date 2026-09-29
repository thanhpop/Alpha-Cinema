using backend.DTO.Common;
using backend.DTO.Reservation;
using backend.Helpers;
using backend.Model;
using backend.Service.Implementations;
using backend.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controller
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController : ControllerBase
    {
        private readonly IReservationService _service;

        public ReservationController(IReservationService service)
        {
            _service = service;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged([FromQuery] ReservationPagedQuery query)
        {
            var data = await _service.GetPagedAsync(query);
            return Ok(ApiResponse<PagedResult<ReservationDto>>.Success(data));
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(string id)
        {
            var reservation = await _service.GetByIdAsync(id);
            if (reservation == null)
                return NotFound(new { message = "Reservation not found" });

            return Ok(reservation);
        }
        [HttpPost]
        public async Task<IActionResult> CreateReservation(ReservationRequestDto dto)
        {
            // Đặt vé cho chính người đang đăng nhập, không tin userId từ client
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized(ApiResponse<string>.Fail("Invalid token", 401));

            var reservation = await _service.CreateReservationAsync(userId.Value, dto);
            return Ok(ApiResponse<ReservationDto>.Success(reservation));
        }
        [HttpPut("confirm/{id}")]
        public async Task<IActionResult> ConfirmReservation(string id)
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<string>.Fail("Reservation not found", 404));

            await _service.ConfirmReservationAsync(id);
            return Ok(ApiResponse<string>.Success("Reservation confirmed"));
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsync(string id)
        {
            var existing = await _service.GetByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<ReservationDto>.Fail("Not found", 404));

            var ok = await _service.CancelReservationAsync(id);
            return NoContent();
        }
        // userId lấy từ JWT để user chỉ xem được đơn của chính mình
        [HttpGet("me")]
        public async Task<IActionResult> GetMine([FromQuery] PagedQuery query)
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized(ApiResponse<string>.Fail("Invalid token", 401));

            var reservations = await _service.GetReservationsByUserAsync(userId.Value, query);
            return Ok(ApiResponse<PagedResult<ReservationDto>>.Success(reservations));
        }

        [HttpGet("me/summary")]
        public async Task<IActionResult> GetMySummary()
        {
            var userId = User.GetUserId();
            if (userId == null)
                return Unauthorized(ApiResponse<string>.Fail("Invalid token", 401));

            var summary = await _service.GetUserSummaryAsync(userId.Value);
            return Ok(ApiResponse<UserReservationSummaryDto>.Success(summary));
        }
    }
}
