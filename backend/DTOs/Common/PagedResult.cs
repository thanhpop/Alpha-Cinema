namespace backend.DTO.Common
{
    public class PagedResult<T>
    {
        public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
        public int Page { get; init; }
        public int PageSize { get; init; }
        public int TotalItems { get; init; }
        public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalItems / (double)PageSize);

        // Dùng khi phải map entity -> DTO ở bộ nhớ (hàm map không dịch được sang SQL)
        public PagedResult<TOut> Map<TOut>(Func<T, TOut> selector) => new()
        {
            Items = Items.Select(selector).ToList(),
            Page = Page,
            PageSize = PageSize,
            TotalItems = TotalItems
        };
    }
}
