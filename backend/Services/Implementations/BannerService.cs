using backend.DTO.Common;
using backend.Helpers;
using backend.Data;
using backend.DTO.Banner;
using backend.Exceptions;
using backend.Model;
using backend.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Service.Implementations
{
    public class BannerService : IBannerService
    {
        private readonly AppDbContext _context;
        public BannerService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<BannerDto>> GetAllAsync()
        {
            return await _context.Banners
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new BannerDto
                {
                    Id = b.Id,
                    ImageUrl = b.ImageUrl,
                    Title = b.Title,
                    IsActive = b.IsActive,
                    DisplayOrder = b.DisplayOrder
                })
                .ToListAsync();
        }

        public async Task<PagedResult<BannerDto>> GetPagedAsync(PagedQuery query)
        {
            var q = _context.Banners.AsNoTracking();

            if (query.Keyword is { } kw)
                q = q.Where(b => b.Title != null && b.Title.Contains(kw));

            return await q
                .OrderBy(b => b.DisplayOrder)
                .ThenBy(b => b.Id)
                .Select(b => new BannerDto
                {
                    Id = b.Id,
                    ImageUrl = b.ImageUrl,
                    Title = b.Title,
                    IsActive = b.IsActive,
                    DisplayOrder = b.DisplayOrder
                })
                .ToPagedResultAsync(query);
        }

        public async Task<List<BannerDto>> GetActiveBannersAsync()
        {
            return await _context.Banners
                .Where(b => b.IsActive)
                .OrderBy(b => b.DisplayOrder)
                .Select(b => new BannerDto
                {
                    Id = b.Id,
                    ImageUrl = b.ImageUrl,
                    Title = b.Title,
                    IsActive = b.IsActive,
                    DisplayOrder = b.DisplayOrder
                })
                .ToListAsync();
        }

        public async Task<BannerDto> CreateAsync(BannerDto dto)
        {
            var banner = new Banner
            {
                ImageUrl = dto.ImageUrl,
                Title = dto.Title,
                IsActive = dto.IsActive,
                DisplayOrder = dto.DisplayOrder
            };

            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();

            dto.Id = banner.Id;
            return dto;
        }

        public async Task<BannerDto> UpdateAsync(int id, BannerDto dto)
        {
            var banner = await FindAsync(id);

            banner.ImageUrl = dto.ImageUrl;
            banner.Title = dto.Title;
            banner.IsActive = dto.IsActive;
            banner.DisplayOrder = dto.DisplayOrder;

            await _context.SaveChangesAsync();
            return new BannerDto
            {
                Id = banner.Id,
                ImageUrl = banner.ImageUrl,
                Title = banner.Title,
                IsActive = banner.IsActive,
                DisplayOrder = banner.DisplayOrder
            };
        }

        public async Task DeleteAsync(int id)
        {
            var banner = await FindAsync(id);

            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();
        }

        private async Task<Banner> FindAsync(int id) =>
            await _context.Banners.FindAsync(id)
            ?? throw new NotFoundException("Không tìm thấy banner.");
    }

}
