using backend.Data;
using backend.Exceptions;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Text.Json;

public class SeatSessionService
{
    private readonly IDatabase _redis;
    private readonly ISubscriber _subscriber;
    private readonly AppDbContext _context;

    private const int HOLD_MINUTES = 5;

    public SeatSessionService(
        IConnectionMultiplexer redis,
        AppDbContext context)
    {
        _redis = redis.GetDatabase();
        _subscriber = redis.GetSubscriber();
        _context = context;
    }

    private string SessionKey(long showtimeId, long userId)
        => $"seat-session:{showtimeId}:{userId}";

    private string IndexKey(long showtimeId)
        => $"seat-index:{showtimeId}";

    public async Task CreateAsync(SeatSession session)
    {
        var showtimeExists = await _context.Showtimes
            .AnyAsync(x => x.Id == session.ShowtimeId);

        if (!showtimeExists)
            throw new NotFoundException("Không tìm thấy suất chiếu.");

        var key = SessionKey(session.ShowtimeId, session.UserId);

        var existingValue = await _redis.StringGetAsync(key);

        if (!existingValue.IsNullOrEmpty)
        {
            var existingSession =
                JsonSerializer.Deserialize<SeatSession>(existingValue!);

            if (existingSession != null &&
                (existingSession.SeatIds == null || !existingSession.SeatIds.Any()))
            {
                await _redis.KeyDeleteAsync(key);
                await _redis.SetRemoveAsync(
                    IndexKey(session.ShowtimeId),
                    session.UserId
                );
            }
            else
            {

                return;
            }
        }

        var now = DateTime.UtcNow;

        session.CreatedAt = now;
        session.ExpireAt = now.AddMinutes(HOLD_MINUTES);

        var json = JsonSerializer.Serialize(session);

        await _redis.StringSetAsync(
            key,
            json,
            TimeSpan.FromMinutes(HOLD_MINUTES)
        );

        await _redis.SetAddAsync(
            IndexKey(session.ShowtimeId),
            session.UserId
        );
    }


    public async Task<SeatSession?> GetAsync(long showtimeId, long userId)
    {
        var value = await _redis.StringGetAsync(SessionKey(showtimeId, userId));
        if (value.IsNullOrEmpty) return null;

        return JsonSerializer.Deserialize<SeatSession>(value!);
    }

    public async Task<SeatSession> GetRequiredAsync(long showtimeId, long userId) =>
        await GetAsync(showtimeId, userId) ?? throw SessionExpired();


    public async Task AddSeatsAsync(long showtimeId, int userId, List<long> seatIds)
    {
        var key = SessionKey(showtimeId, userId);

        var session = await GetRequiredAsync(showtimeId, userId);

        if (seatIds == null || !seatIds.Any())
            throw new BadRequestException("Vui lòng chọn ít nhất một ghế.");

        var seatsInDb = await _context.Seats
            .Where(s => seatIds.Contains(s.Id))
            .ToListAsync();

        if (seatsInDb.Count != seatIds.Count)
            throw new NotFoundException("Không tìm thấy ghế.");

        if (seatsInDb.Any(s => s.ShowtimeId != showtimeId))
            throw new BadRequestException("Ghế không thuộc suất chiếu này.");

        if (seatsInDb.Any(s => s.IsReserved))
            throw new ConflictException("Ghế đã có người đặt.");

        foreach (var seatId in seatIds)
        {
            if (!session.SeatIds.Contains(seatId))
                session.SeatIds.Add(seatId);
        }

        var json = JsonSerializer.Serialize(session);
        var ttl = await _redis.KeyTimeToLiveAsync(key);

        if (ttl == null)
            throw SessionExpired();

        await _redis.StringSetAsync(key, json, ttl.Value);

        await PublishSeatUpdate(showtimeId);
    }

    public async Task RemoveSeatsAsync(long showtimeId, int userId, List<long> seatIds)
    {
        var key = SessionKey(showtimeId, userId);

        var session = await GetAsync(showtimeId, userId);
        if (session == null) return;

        foreach (var seatId in seatIds)
        {
            session.SeatIds.Remove(seatId);
        }

        var json = JsonSerializer.Serialize(session);
        var ttl = await _redis.KeyTimeToLiveAsync(key);

        if (ttl == null)
            throw SessionExpired();

        await _redis.StringSetAsync(key, json, ttl.Value);

        await PublishSeatUpdate(showtimeId);
    }


    public async Task RemoveAsync(long showtimeId, long userId)
    {
        await _redis.KeyDeleteAsync(SessionKey(showtimeId, userId));

        await _redis.SetRemoveAsync(
            IndexKey(showtimeId),
            userId
        );

        await PublishSeatUpdate(showtimeId);
    }

    public async Task<List<long>> GetAllHoldSeatsByShowtime(long showtimeId)
    {
        var userIds = await _redis.SetMembersAsync(IndexKey(showtimeId));

        var result = new List<long>();

        foreach (var userId in userIds)
        {
            var json = await _redis.StringGetAsync(
                SessionKey(showtimeId, (int)userId)
            );

            if (json.IsNullOrEmpty)
            {
                await _redis.SetRemoveAsync(IndexKey(showtimeId), userId);
                continue;
            }

            var session = JsonSerializer.Deserialize<SeatSession>(json!);
            if (session?.SeatIds != null)
                result.AddRange(session.SeatIds);
        }

        return result.Distinct().ToList();
    }
    public async Task<int?> GetTtlAsync(long showtimeId, int userId)
    {
        var ttl = await _redis.KeyTimeToLiveAsync(
            SessionKey(showtimeId, userId)
        );

        if (ttl == null)
            return null;

        return (int)ttl.Value.TotalSeconds;
    }
    public async Task ExtendTtlAsync(long showtimeId, long userId, int minutes)
    {
        var key = SessionKey(showtimeId, userId);

        var session = await GetRequiredAsync(showtimeId, userId);

        var newExpire = DateTime.UtcNow.AddMinutes(minutes);
        session.ExpireAt = newExpire;

        var json = JsonSerializer.Serialize(session);

        await _redis.StringSetAsync(
            key,
            json,
            TimeSpan.FromMinutes(minutes)
        );
    }

    private static NotFoundException SessionExpired() =>
        new("Phiên giữ ghế đã hết hạn, vui lòng chọn lại ghế.");


    private async Task PublishSeatUpdate(long showtimeId)
    {
        await _subscriber.PublishAsync(
            RedisChannel.Literal("seat-updated"),
            showtimeId.ToString()
        );
    }

}