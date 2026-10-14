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
            return Ok(reservation);
        }
        [HttpPost]
        public async Task<IActionResult> CreateReservation(ReservationRequestDto dto)
        {
            var reservation = await _service.CreateReservationAsync(User.GetRequiredUserId(), dto);
            return Ok(ApiResponse<ReservationDto>.Success(reservation));
        }
        [HttpPut("confirm/{id}")]
        public async Task<IActionResult> ConfirmReservation(string id)
        {
            await _service.ConfirmReservationAsync(id);
            return Ok(ApiResponse<string>.Success("Reservation confirmed"));
        }
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsync(string id)
        {
            await _service.CancelReservationAsync(id);
            return NoContent();
        }
        [HttpGet("me")]
        public async Task<IActionResult> GetMine([FromQuery] PagedQuery query)
        {
            var reservations = await _service.GetReservationsByUserAsync(User.GetRequiredUserId(), query);
            return Ok(ApiResponse<PagedResult<ReservationDto>>.Success(reservations));
        }

        [HttpGet("me/summary")]
        public async Task<IActionResult> GetMySummary()
        {
            var summary = await _service.GetUserSummaryAsync(User.GetRequiredUserId());
            return Ok(ApiResponse<UserReservationSummaryDto>.Success(summary));
        }
    }
}
