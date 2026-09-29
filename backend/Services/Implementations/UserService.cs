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
