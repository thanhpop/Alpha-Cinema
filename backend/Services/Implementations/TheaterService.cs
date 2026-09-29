using backend.DTO.Common;
using backend.Helpers;
using backend.Data;
using backend.DTO.Theater;
using backend.Model;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Implementations
{
    public class TheaterService : ITheaterService
    {
        private readonly AppDbContext _db;
        public TheaterService(AppDbContext db) => _db = db;

        public async Task<IEnumerable<TheaterDto>> GetAllAsync()
        {
            var entities = await _db.Theaters.AsNoTracking().ToListAsync();
            return entities.Select(MapToDto);
        }

        public async Task<PagedResult<TheaterDto>> GetPagedAsync(PagedQuery query)
        {
            var q = _db.Theaters.AsNoTracking();

            if (query.Keyword is { } kw)
                q = q.Where(t => (t.name != null && t.name.Contains(kw)) ||
                                 (t.location != null && t.location.Contains(kw)));

            var paged = await q.OrderByDescending(t => t.id).ToPagedResultAsync(query);
            return paged.Map(MapToDto);
        }

        public async Task<TheaterDto?> GetByIdAsync(long id)
        {
            var entity = await _db.Theaters.AsNoTracking()
                .FirstOrDefaultAsync(t => t.id == id);

            return entity == null ? null : MapToDto(entity);
        }

        public async Task<IEnumerable<TheaterDto>> GetByLocationAsync(string location)
        {
            if (string.IsNullOrWhiteSpace(location))
                return Enumerable.Empty<TheaterDto>();

            var q = location.Trim().ToLowerInvariant();

            var list = await _db.Theaters
                .AsNoTracking()
                .Where(t => !string.IsNullOrEmpty(t.location) &&
                            t.location.ToLower().Contains(q))
                .ToListAsync();

            return list.Select(MapToDto);
        }

        public async Task<TheaterDto> CreateAsync(TheaterDto dto)
        {
            var entity = MapToEntity(dto);

            _db.Theaters.Add(entity);
            await _db.SaveChangesAsync();

            return MapToDto(entity);
        }

        public async Task<TheaterDto?> UpdateAsync(long id, TheaterDto dto)
        {
            var existing = await _db.Theaters.FindAsync(id);
            if (existing == null) return null;

            existing.name = dto.Name;
            existing.location = dto.Location;
            existing.capacity = dto.Capacity;

            await _db.SaveChangesAsync();
            return MapToDto(existing);
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var existing = await _db.Theaters.FindAsync(id);
            if (existing == null) return false;

            _db.Theaters.Remove(existing);
            await _db.SaveChangesAsync();
            return true;
        }

        private static TheaterDto MapToDto(Theater t)
        {
            return new TheaterDto
            {
                Id = t.id,
                Name = t.name,
                Location = t.location,
                Capacity = t.capacity
            };
        }

        private static Theater MapToEntity(TheaterDto dto)
        {
            return new Theater
            {
                name = dto.Name,
                location = dto.Location,
                capacity = dto.Capacity
            };
        }
    }
}
