using backend.Model;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public static class DbSeeder
    {
        public const string AdminRole = "ADMIN";
        public const string UserRole = "USER";

        private static readonly string[] Roles = { AdminRole, UserRole };

        public static async Task SeedAsync(AppDbContext db, ILogger logger)
        {
            await SeedRolesAsync(db, logger);
            await SeedAdminAsync(db, logger);
        }

        private static async Task SeedRolesAsync(AppDbContext db, ILogger logger)
        {
            var existing = await db.Roles.Select(r => r.name).ToListAsync();
            var missing = Roles.Where(r => !existing.Contains(r)).ToList();
            if (missing.Count == 0) return;

            db.Roles.AddRange(missing.Select(name => new Role { name = name }));
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded roles: {Roles}", string.Join(", ", missing));
        }

        private static async Task SeedAdminAsync(AppDbContext db, ILogger logger)
        {
            var username = Environment.GetEnvironmentVariable("ADMIN_USERNAME")?.Trim();
            var email = Environment.GetEnvironmentVariable("ADMIN_EMAIL")?.Trim().ToLowerInvariant();
            var password = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                logger.LogWarning("ADMIN_USERNAME / ADMIN_PASSWORD missing in .env, skip seeding admin account");
                return;
            }

            var adminRole = await db.Roles.FirstAsync(r => r.name == AdminRole);
            var admin = await db.Users.FirstOrDefaultAsync(u => u.username == username);

            if (admin == null)
            {
                db.Users.Add(new User
                {
                    username = username,
                    email = email,
                    password = BCrypt.Net.BCrypt.HashPassword(password),
                    role_id = adminRole.id
                });
                await db.SaveChangesAsync();
                logger.LogInformation("Seeded admin account: {Username}", username);
                return;
            }

            if (admin.role_id != adminRole.id)
            {
                admin.role_id = adminRole.id;
                await db.SaveChangesAsync();
                logger.LogInformation("Promoted existing user {Username} to {Role}", username, AdminRole);
            }
        }
    }
}
