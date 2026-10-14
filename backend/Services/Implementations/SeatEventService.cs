using backend.Data;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Collections.Concurrent;
using System.Text.Json;

public class SeatEventService
{
    private readonly ConcurrentDictionary<long, ConcurrentDictionary<HttpResponse, byte>> _clients
        = new();

    private readonly ISubscriber _subscriber;
    private readonly IServiceScopeFactory _scopeFactory;

    public SeatEventService(
        IConnectionMultiplexer redis,
        IServiceScopeFactory scopeFactory)
    {
        _subscriber = redis.GetSubscriber();
        _scopeFactory = scopeFactory;

        SubscribeRedis();
    }

    private void SubscribeRedis()
    {
        _subscriber.Subscribe(RedisChannel.Literal("seat-updated"), async (channel, message) =>
        {
            if (!message.TryParse(out int showtimeId))
                return;

            using var scope = _scopeFactory.CreateScope();
            var seatSessionService = scope.ServiceProvider
                .GetRequiredService<SeatSessionService>();

            var db = scope.ServiceProvider
       .GetRequiredService<AppDbContext>();

            var holdSeats = await seatSessionService
                .GetAllHoldSeatsByShowtime(showtimeId);

            var soldSeats = await db.Seats
        .Where(s => s.ShowtimeId == showtimeId && s.IsReserved)
        .Select(s => s.Id)
        .ToListAsync();

            await BroadcastAsync(showtimeId, new
            {
                holdSeatIds = holdSeats,
                soldSeatIds = soldSeats
            });
        });
        _subscriber.Subscribe(RedisChannel.Literal("__keyevent@0__:expired"), async (channel, key) =>
        {
            var keyStr = key.ToString();

            Console.WriteLine("Expired key: " + keyStr);

            if (!keyStr.StartsWith("seat-session:"))
                return;

            var parts = keyStr.Split(':');

            if (parts.Length < 3)
                return;

            int showtimeId = int.Parse(parts[1]);
            await _subscriber.PublishAsync(RedisChannel.Literal("seat-updated"), showtimeId);
        });
    }

    public void AddClient(long showtimeId, HttpResponse response)
    {
        var clients = _clients.GetOrAdd(
            showtimeId,
            _ => new ConcurrentDictionary<HttpResponse, byte>()
        );

        clients.TryAdd(response, 0);
    }

    public void RemoveClient(long showtimeId, HttpResponse response)
    {
        if (_clients.TryGetValue(showtimeId, out var clients))
        {
            clients.TryRemove(response, out _);
        }
    }

    public async Task BroadcastAsync(long showtimeId, object data)
    {
        if (!_clients.TryGetValue(showtimeId, out var clients))
            return;

        var json = JsonSerializer.Serialize(data);
        var message = $"data: {json}\n\n";

        var deadClients = new List<HttpResponse>();

        foreach (var client in clients.Keys)
        {
            try
            {
                await client.WriteAsync(message);
                await client.Body.FlushAsync();
            }
            catch
            {
                deadClients.Add(client);
            }
        }

        foreach (var dead in deadClients)
        {
            clients.TryRemove(dead, out _);
        }
    }
}