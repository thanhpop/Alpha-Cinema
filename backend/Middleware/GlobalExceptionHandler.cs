using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;

namespace backend.Middleware
{
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly IProblemDetailsService _problemDetailsService;
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(IProblemDetailsService problemDetailsService, ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
            _problemDetailsService = problemDetailsService;
        }
        public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {

            var status = StatusCodes.Status500InternalServerError;
            var title = "An error occurred.";
            object? detailObj = exception.Message;


            switch (exception)
            {
                case BadHttpRequestException badReq:
                    _logger.LogWarning(exception, "Bad request: {Message}", badReq.Message);
                    status = StatusCodes.Status400BadRequest;
                    title = "Bad request";
                    detailObj = badReq.Message;
                    break;

                case ArgumentException:
                case InvalidOperationException:
                    _logger.LogWarning(exception, "Invalid argument/state: {Message}", exception.Message);
                    status = StatusCodes.Status400BadRequest;
                    title = "Invalid argument";
                    detailObj = exception.Message;
                    break;

                default:
                    _logger.LogError(exception, "Unhandled exception occurred");
                    status = StatusCodes.Status500InternalServerError;
                    title = "Internal Server Error";
                    detailObj = exception.Message;
                    break;
            }

            var problem = new ProblemDetails
            {
                Title = title,
                Detail = detailObj is string s ? s : null,
                Status = status,
            };
            problem.Type = null;
            problem.Extensions["timestamp"] = DateTime.UtcNow.ToString();
            problem.Extensions.Remove("traceId");

            await _problemDetailsService.WriteAsync(new ProblemDetailsContext
            {
                HttpContext = httpContext,
                ProblemDetails = problem,
                Exception = exception
            });
            return true;
        }
    }
}
