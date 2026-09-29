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

    private bool TryGetUserId(out int userId)
    {
        var id = User.GetUserId();
        userId = id.HasValue ? (int)id.Value : 0;
        return id.HasValue;
    }

    [HttpPost("start")]
    public async Task<IActionResult> Start([FromQuery] int showtimeId)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized("Invalid token");

        var session = new SeatSession
        {
            ShowtimeId = showtimeId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _service.CreateAsync(session);

        if (!created)
            return BadRequest("Showtime does not exist");

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
        if (!TryGetUserId(out var userId)) return Unauthorized("Invalid token");

        await _service.AddSeatsAsync(showtimeId, userId, seatIds);
        return Ok("Seats added");
    }

    [HttpPost("{showtimeId}/remove")]
    public async Task<IActionResult> RemoveSeats(
        int showtimeId,
        [FromBody] List<long> seatIds)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized("Invalid token");

        await _service.RemoveSeatsAsync(showtimeId, userId, seatIds);
        return Ok("SeatIds removed");
    }

    [HttpGet("{showtimeId}")]
    public async Task<IActionResult> Get(int showtimeId)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized("Invalid token");

        var session = await _service.GetAsync(showtimeId, userId);
        if (session == null)
            return NotFound("Session expired or not found");

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
        if (!TryGetUserId(out var userId)) return Unauthorized("Invalid token");

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
        if (!TryGetUserId(out var userId)) return Unauthorized("Invalid token");

        var ttl = await _service.GetTtlAsync(showtimeId, userId);
        return Ok(ttl);
    }

    [HttpDelete("{showtimeId}")]
    public async Task<IActionResult> Finish(int showtimeId)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized("Invalid token");

        await _service.RemoveAsync(showtimeId, userId);
        return Ok("Seat session removed");
    }
}
