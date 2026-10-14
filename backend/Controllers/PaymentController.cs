using backend.DTO.Payment;
using backend.Helpers;
using backend.Model.Vnpay;
using backend.Service.Interfaces;
using backend.Service.Vnpay;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;



namespace backend.Controller
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {

        private readonly IVnPayService _vnPayService;
        private readonly SeatSessionService _seatSessionService;
        private readonly IReservationService _reservationService;
        public PaymentController(IVnPayService vnPayService, SeatSessionService seatSessionService, IReservationService reservationService)
        {

            _vnPayService = vnPayService;
            _seatSessionService = seatSessionService;
            _reservationService = reservationService;
        }
        [HttpPost("vnpay")]
        public async Task<IActionResult> CreatePaymentUrlVnpay(PaymentInformationDto model)
        {
            var reservation = await _reservationService.GetByIdAsync(model.ReservationId);

            await _seatSessionService.ExtendTtlAsync(reservation.ShowtimeId, reservation.UserId, 15);

            var paymentModel = new PaymentInformationModel
            {
                ReservationId = model.ReservationId,
                Amount = model.Amount,
            };

            var url = _vnPayService.CreatePaymentUrl(paymentModel, HttpContext);

            return Ok(ApiResponse<PaymentDto>.Success(
                new PaymentDto { PaymentUrl = url }
            ));
        }
        [HttpGet]
        public IActionResult PaymentCallbackVnpay()
        {
            var response = _vnPayService.PaymentExecute(Request.Query);

            return new JsonResult(response);
        }


    }
}
