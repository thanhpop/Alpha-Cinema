using backend.DTO.Common;
using backend.Helpers;
using backend.Data;
using backend.DTO.User;
using backend.Model;
using backend.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Service.Implementations
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
        public UserService(AppDbContext db) => _db = db;

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            return await _db.Set<User>()
                .AsNoTracking()
                .Select(u => new UserDto
                {
                    Id = u.id,
                    Username = u.username,
                    Email = u.email,
                })
                .ToListAsync();
        }

        public async Task<PagedResult<UserDto>> GetPagedAsync(PagedQuery query)
        {
            var q = _db.Set<User>().AsNoTracking();

            if (query.Keyword is { } kw)
                q = q.Where(u => (u.username != null && u.username.Contains(kw)) ||
                                 (u.email != null && u.email.Contains(kw)));

            return await q
                .OrderByDescending(u => u.id)
                .Select(u => new UserDto
                {
                    Id = u.id,
                    Username = u.username,
                    Email = u.email,
                })
                .ToPagedResultAsync(query);
        }

        public async Task<UserDto?> GetByIdAsync(long id)
        {
            var u = await _db.Set<User>()
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.id == id);

            if (u == null) return null;

            return new UserDto
            {
                Id = u.id,
                Username = u.username,
                Email = u.email,
            };
        }

        public async Task<UserProfileDto?> GetProfileAsync(long id)
        {
            var u = await _db.Set<User>()
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.id == id);

            return u == null ? null : ToProfileDto(u);
        }

        public async Task<UserProfileDto?> UpdateProfileAsync(long id, UpdateProfileDto dto)
        {
            var u = await _db.Set<User>().FindAsync(id);
            if (u == null) return null;

            u.phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();
            u.gender = string.IsNullOrWhiteSpace(dto.Gender) ? null : dto.Gender;
            u.dateOfBirth = dto.DateOfBirth?.Date;

            await _db.SaveChangesAsync();
            return ToProfileDto(u);
        }

        private static UserProfileDto ToProfileDto(User u) => new()
        {
            Id = u.id,
            Username = u.username,
            Email = u.email,
            Phone = u.phone,
            Gender = u.gender,
            DateOfBirth = u.dateOfBirth,
        };

        public async Task<bool> DeleteAsync(long id)
        {
            var user = await _db.Set<User>().FindAsync(id);
            if (user == null) return false;

            _db.Set<User>().Remove(user);
            await _db.SaveChangesAsync();
            return true;
        }
    }
}
