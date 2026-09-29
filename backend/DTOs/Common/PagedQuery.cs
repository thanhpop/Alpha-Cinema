namespace backend.DTO.Common
{
    // Tham số phân trang chung, bind từ query string: ?page=1&pageSize=10&search=abc
    public class PagedQuery
    {
        private const int DefaultPageSize = 10;
        private const int MaxPageSize = 100;

        private int _page = 1;
        private int _pageSize = DefaultPageSize;

        public int Page
        {
            get => _page;
            set => _page = value < 1 ? 1 : value;
        }

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value < 1 ? DefaultPageSize : Math.Min(value, MaxPageSize);
        }

        public string? Search { get; set; }

        public int Skip => (Page - 1) * PageSize;

        public string? Keyword => string.IsNullOrWhiteSpace(Search) ? null : Search.Trim();
    }
}
