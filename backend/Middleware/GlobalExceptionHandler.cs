using backend.Exceptions;
using backend.Helpers;
using Microsoft.AspNetCore.Diagnostics;

namespace backend.Middleware
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            var (status, message) = exception switch
            {
                AppException app => (app.StatusCode, app.Message),
                BadHttpRequestException badReq => (badReq.StatusCode, "Yêu cầu không hợp lệ."),
                _ => (StatusCodes.Status500InternalServerError, "Đã có lỗi xảy ra, vui lòng thử lại sau.")
            };
            if (status >= StatusCodes.Status500InternalServerError)
                _logger.LogError(exception, "Unhandled exception occurred");
            else
                _logger.LogWarning("{StatusCode} {Path}: {Message}", status, httpContext.Request.Path, exception.Message);

            httpContext.Response.StatusCode = status;
            await httpContext.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(message, status), cancellationToken);
            return true;
        }
    }
}
