using backend.DTO.Common;
using backend.Helpers;
using backend.Data;
using backend.DTO.Articles;
using backend.Model;
using backend.Service.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Service.Implementations
{
    public class ArticleService : IArticlesService
    {
        private readonly AppDbContext _context;

        public ArticleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ArticlesDto>> GetAllAsync()
        {
            return await _context.Articles
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => ToDto(n))
                .ToListAsync();
        }

        public async Task<PagedResult<ArticlesDto>> GetPagedAsync(PagedQuery query)
        {
            var q = _context.Articles.AsNoTracking();

            if (query.Keyword is { } kw)
                q = q.Where(n => n.Title.Contains(kw));

            var paged = await q
                .OrderByDescending(n => n.CreatedAt)
                .ThenByDescending(n => n.Id)
                .ToPagedResultAsync(query);
            return paged.Map(ToDto);
        }

        public async Task<List<ArticlesDto>> GetActiveAsync()
        {
            return await _context.Articles
                .Where(n => n.IsActive)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => ToDto(n))
                .ToListAsync();
        }

        public async Task<ArticlesDto?> GetByIdAsync(int id)
        {
            var news = await _context.Articles.FindAsync(id);
            return news == null ? null : ToDto(news);
        }

        public async Task<ArticlesDto> CreateAsync(ArticlesDto dto)
        {
            var news = new Article
            {
                Title = dto.Title,
                Summary = dto.Summary,
                Content = dto.Content,
                ImageUrl = dto.ImageUrl,
                Category = dto.Category,
                IsActive = dto.IsActive
            };

            _context.Articles.Add(news);
            await _context.SaveChangesAsync();

            return ToDto(news);
        }

        public async Task<ArticlesDto?> UpdateAsync(int id, ArticlesDto dto)
        {
            var news = await _context.Articles.FindAsync(id);
            if (news == null) return null;

            news.Title = dto.Title;
            news.Summary = dto.Summary;
            news.Content = dto.Content;
            news.ImageUrl = dto.ImageUrl;
            news.Category = dto.Category;
            news.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();
            return ToDto(news);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var news = await _context.Articles.FindAsync(id);
            if (news == null) return false;

            _context.Articles.Remove(news);
            await _context.SaveChangesAsync();
            return true;
        }

        private static ArticlesDto ToDto(Article n) => new()
        {
            Id = n.Id,
            Title = n.Title,
            Summary = n.Summary,
            Content = n.Content,
            ImageUrl = n.ImageUrl,
            Category = n.Category,
            CreatedAt = n.CreatedAt,
            IsActive = n.IsActive
        };
    }
}
