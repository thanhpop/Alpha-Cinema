

using backend.Data;
using backend.Extensions;
using backend.Helpers;
using backend.Middleware;
using backend.Service.Implementations;
using backend.Service.Interfaces;
using backend.Service.Vnpay;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using StackExchange.Redis;
using System.Text;

Env.Load();

var builder = WebApplication.CreateBuilder(args);


var conn = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(conn, ServerVersion.AutoDetect(conn)));

builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var redisConn = Environment.GetEnvironmentVariable("REDIS_CONNECTION")
                    ?? throw new InvalidOperationException("REDIS_CONNECTION missing in .env file");
    return ConnectionMultiplexer.Connect(redisConn);
});

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateLogger();

builder.Host.UseSerilog();


builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Lỗi validation trả cùng định dạng ApiResponse: message là lỗi đầu tiên, data là lỗi theo từng field
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(e => e.Key, e => e.Value!.Errors.Select(x => x.ErrorMessage).ToArray());

            // Key rỗng hoặc bắt đầu bằng "$" là lỗi parse JSON, message của .NET không dùng được cho người dùng
            var malformed = errors.Keys.Any(k => k.Length == 0 || k.StartsWith('$'));
            var message = malformed
                ? "Dữ liệu gửi lên không đúng định dạng."
                : errors.Values.SelectMany(x => x).FirstOrDefault(m => !string.IsNullOrWhiteSpace(m))
                  ?? "Dữ liệu không hợp lệ.";

            return new BadRequestObjectResult(new ApiResponse<object>(StatusCodes.Status400BadRequest, message, errors));
        };
    });
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();


builder.Services.AddApplicationServices();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200") 
              .AllowAnyHeader()
              .AllowAnyMethod()
               .AllowCredentials();
    });


    options.AddPolicy("AllowAllDev", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});




var key = Environment.GetEnvironmentVariable("JWT_KEY")
          ?? throw new InvalidOperationException("JWT_KEY missing in .env file");

var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; 
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = !string.IsNullOrEmpty(issuer),
        ValidIssuer = issuer,
        ValidateAudience = !string.IsNullOrEmpty(audience),
        ValidAudience = audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});


builder.Services.AddAuthorization();

var app = builder.Build();

app.UseSerilogRequestLogging(options =>
{
    options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.00} ms";
});

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var db = services.GetRequiredService<AppDbContext>();

    try
    {

         db.Database.EnsureCreated();
         var connection = db.Database.GetDbConnection();
         logger.LogInformation("Database connected successfully: {Database} @ {DataSource}", connection.Database, connection.DataSource);

         await DbSeeder.SeedAsync(db, logger);

    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to connect to the Database");
    }
}





app.UseExceptionHandler();


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();


}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowReact");



app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
