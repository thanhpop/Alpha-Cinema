using System.Linq.Expressions;
using backend.DTO.Common;
using backend.Helpers;
using backend.Data;
using backend.DTO.User;
using backend.Exceptions;
using backend.Model;
using backend.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Service.Implementations
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
        public UserService(AppDbContext db) => _db = db;

        private static readonly Expression<Func<User, UserDto>> ToDtoExpr = u => new UserDto
        {
            Id = u.id,
            Username = u.username,
            Email = u.email,
            Phone = u.phone,
            Gender = u.gender,
            DateOfBirth = u.dateOfBirth,
        };

        private static readonly Func<User, UserDto> ToDto = ToDtoExpr.Compile();

        public async Task<IEnumerable<UserDto>> GetAllAsync()
        {
            return await _db.Set<User>()
                .AsNoTracking()
                .Select(ToDtoExpr)
                .ToListAsync();
        }

        public async Task<PagedResult<UserDto>> GetPagedAsync(PagedQuery query)
        {
            var q = _db.Set<User>().AsNoTracking();

            if (query.Keyword is { } kw)
                q = q.Where(u => (u.username != null && u.username.Contains(kw)) ||
                                 (u.email != null && u.email.Contains(kw)) ||
                                 (u.phone != null && u.phone.Contains(kw)));

            return await q
                .OrderByDescending(u => u.id)
                .Select(ToDtoExpr)
                .ToPagedResultAsync(query);
        }

        public async Task<UserDto> GetByIdAsync(long id)
        {
            return await _db.Set<User>()
                .AsNoTracking()
                .Where(x => x.id == id)
                .Select(ToDtoExpr)
                .FirstOrDefaultAsync()
                ?? throw UserNotFound();
        }

        public async Task<UserProfileDto> GetProfileAsync(long id)
        {
            var u = await _db.Set<User>()
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.id == id)
                ?? throw UserNotFound();

            return ToProfileDto(u);
        }

        public async Task<UserProfileDto> UpdateProfileAsync(long id, UpdateProfileDto dto)
        {
            var u = await FindAsync(id);

            ApplyProfile(u, dto);

            await _db.SaveChangesAsync();
            return ToProfileDto(u);
        }

        public async Task<UserDto> UpdateAsync(long id, AdminUpdateUserDto dto)
        {
            var u = await FindAsync(id);

            var email = dto.Email!.Trim().ToLowerInvariant();

            var taken = await _db.Set<User>().AnyAsync(x => x.id != id && x.email == email);
            if (taken)
                throw new ConflictException("Email đã được sử dụng.");

            u.email = email;
            ApplyProfile(u, dto);

            await _db.SaveChangesAsync();
            return ToDto(u);
        }

        private static void ApplyProfile(User u, UpdateProfileDto dto)
        {
            u.phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim();
            u.gender = string.IsNullOrWhiteSpace(dto.Gender) ? null : dto.Gender;
            u.dateOfBirth = dto.DateOfBirth?.Date;
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

        public async Task DeleteAsync(long id, long currentUserId)
        {
            if (id == currentUserId)
                throw new BadRequestException("Không thể xóa tài khoản đang đăng nhập.");

            var user = await FindAsync(id);

            if (await _db.Reservations.AnyAsync(r => r.UserId == id))
                throw new ConflictException("Người dùng đã có lịch sử đặt vé, không thể xóa.");

            _db.Set<User>().Remove(user);
            await _db.SaveChangesAsync();
        }

        private async Task<User> FindAsync(long id) =>
            await _db.Set<User>().FindAsync(id) ?? throw UserNotFound();

        private static NotFoundException UserNotFound() => new("Không tìm thấy người dùng.");
    }
}
