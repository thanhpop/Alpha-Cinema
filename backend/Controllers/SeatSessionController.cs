using backend.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// userId luôn lấy từ JWT để không ai giữ / nhả ghế thay người khác được
[Authorize]
[ApiController]
[Route("api/seat-sessions")]
public class SeatSessionController : ControllerBase
{
    private readonly SeatSessionService _service;

    public SeatSessionController(SeatSessionService service)
    {
        _service = service;
    }

    private int CurrentUserId => (int)User.GetRequiredUserId();

    [HttpPost("start")]
    public async Task<IActionResult> Start([FromQuery] int showtimeId)
    {
        var userId = CurrentUserId;

        var session = new SeatSession
        {
            ShowtimeId = showtimeId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _service.CreateAsync(session);

        var savedSession = await _service.GetAsync(showtimeId, userId);

        return Ok(new
        {
            message = "Seat session started",
            expiresInMinutes = 5,
            expireAt = savedSession?.ExpireAt,
            serverTime = DateTime.UtcNow

        });
    }

    [HttpPost("{showtimeId}/add")]
    public async Task<IActionResult> AddSeats(
        int showtimeId,
        [FromBody] List<long> seatIds)
    {
        var userId = CurrentUserId;

        await _service.AddSeatsAsync(showtimeId, userId, seatIds);
        return Ok("Seats added");
    }

    [HttpPost("{showtimeId}/remove")]
    public async Task<IActionResult> RemoveSeats(
        int showtimeId,
        [FromBody] List<long> seatIds)
    {
        var userId = CurrentUserId;

        await _service.RemoveSeatsAsync(showtimeId, userId, seatIds);
        return Ok("SeatIds removed");
    }

    [HttpGet("{showtimeId}")]
    public async Task<IActionResult> Get(int showtimeId)
    {
        var userId = CurrentUserId;

        var session = await _service.GetRequiredAsync(showtimeId, userId);

        var ttl = await _service.GetTtlAsync(showtimeId, userId);

        return Ok(new
        {
            session,
            ttlSeconds = ttl
        });
    }

    [HttpGet("{showtimeId}/snapshot")]
    public async Task<IActionResult> Snapshot(int showtimeId)
    {
        var userId = CurrentUserId;

        var session = await _service.GetAsync(showtimeId, userId);
        var ttl = await _service.GetTtlAsync(showtimeId, userId);
        var holdSeats = await _service.GetAllHoldSeatsByShowtime(showtimeId);

        return Ok(new
        {
            mySeats = session?.SeatIds ?? new List<long>(),
            holdSeats,
            ttl = ttl,
            expireAt = session?.ExpireAt,
            serverTime = DateTime.UtcNow
        });
    }

    [HttpGet("{showtimeId:long}/ttl")]
    public async Task<IActionResult> GetSessionTtl(long showtimeId)
    {
        var userId = CurrentUserId;

        var ttl = await _service.GetTtlAsync(showtimeId, userId);
        return Ok(ttl);
    }

    [HttpDelete("{showtimeId}")]
    public async Task<IActionResult> Finish(int showtimeId)
    {
        var userId = CurrentUserId;

        await _service.RemoveAsync(showtimeId, userId);
        return Ok("Seat session removed");
    }
}
