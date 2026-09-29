using backend.DTO.Common;
using Microsoft.EntityFrameworkCore;

namespace backend.Helpers
{
    public static class QueryableExtensions
    {
        // Query nên được OrderBy trước khi gọi để thứ tự các trang ổn định
        public static async Task<PagedResult<T>> ToPagedResultAsync<T>(this IQueryable<T> source, PagedQuery query)
        {
            var total = await source.CountAsync();
            var items = await source.Skip(query.Skip).Take(query.PageSize).ToListAsync();

            return new PagedResult<T>
            {
                Items = items,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalItems = total
            };
        }
    }
}
