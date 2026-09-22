using backend.Model;
using backend.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Theater> Theaters { get; set; } = null!;
        public DbSet<Movie> Movies { get; set; } = null!;

        public DbSet<Seat> Seats { get; set; } = null!;

        public DbSet<Showtime> Showtimes { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;

        public DbSet<Role> Roles { get; set; } = null!;

        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Reservation> Reservations { get; set; } = null!;
        public DbSet<Banner> Banners { get; set; }

        public DbSet<Article> Articles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Movie>(entity =>
            {
                entity.ToTable("movie");
                entity.Property(e => e.CreatedAt)
                       .HasColumnName("created_at")
                       .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.UpdatedAt)
                      .HasColumnName("updated_at")
                      .HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

                var converter = new ValueConverter<List<string>, string>(
                    v => JsonSerializer.Serialize(v, new JsonSerializerOptions()),
                    v => string.IsNullOrEmpty(v) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(v, new JsonSerializerOptions())!
                );

                var stringListComparer = new ValueComparer<List<string>>(
                  (c1, c2) => c1.SequenceEqual(c2), 
                  c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                  c => c.ToList() 
              );

                entity.Property(e => e.genres)
                      .HasConversion(converter)
                      .HasColumnType("json")
                      .Metadata.SetValueComparer(stringListComparer);

            });

            modelBuilder.Entity<Seat>(entity =>
            {
                entity.ToTable("seat");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.ShowtimeId)
                      .HasColumnName("showtime_id")
                      .IsRequired();

                entity.Property(e => e.SeatNumber)
                      .HasColumnName("seat_number");



                entity.Property(e => e.IsReserved).HasColumnName("is_reserved");
                entity.Property(e => e.ReservationId).HasColumnName("reservation_id");
                entity.HasIndex(e => new { e.ShowtimeId, e.SeatNumber })
                         .IsUnique()
                        .HasDatabaseName("unique_seat");

            });
            modelBuilder.Entity<RefreshToken>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("refresh_token");
                entity.HasIndex(e => e.Token).IsUnique();
                entity.Property(e => e.Token).HasMaxLength(512).IsRequired();
                entity.HasOne(e => e.User)
                      .WithMany() // or .WithMany(u => u.RefreshTokens) if you add collection on User
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

        }
        private void UpdateTimestamps()
        {
            var now = DateTimeHelper.Now;
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is AbstractMappedEntity && (e.State == EntityState.Added || e.State == EntityState.Modified));

            foreach (var entry in entries)
            {
                var entity = (AbstractMappedEntity)entry.Entity!;
                if (entry.State == EntityState.Added)
                {
                    entity.CreatedAt = now;
                }
                entity.UpdatedAt = now;
            }
        }
        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
