using backend.Service.Interfaces;
using System.Net;
using System.Net.Mail;
using System.Text;

namespace backend.Service.Implementations
{
    public class EmailService : IEmailService
    {
        public async Task SendAsync(string to, string subject, string htmlBody)
        {
            var host = Environment.GetEnvironmentVariable("SMTP_HOST")
                       ?? throw new InvalidOperationException("SMTP_HOST missing in .env file");
            var port = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587");
            var enableSsl = !string.Equals(Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL"), "false", StringComparison.OrdinalIgnoreCase);
            var username = Environment.GetEnvironmentVariable("SMTP_USERNAME");
            var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
            var fromEmail = Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? username
                            ?? throw new InvalidOperationException("SMTP_FROM_EMAIL missing in .env file");
            var fromName = Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? "Alpha Cinema";

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName, Encoding.UTF8),
                Subject = subject,
                SubjectEncoding = Encoding.UTF8,
                Body = htmlBody,
                BodyEncoding = Encoding.UTF8,
                IsBodyHtml = true
            };
            message.To.Add(to);

            using var client = new SmtpClient(host, port) { EnableSsl = enableSsl };
            if (!string.IsNullOrEmpty(username))
                client.Credentials = new NetworkCredential(username, password);

            await client.SendMailAsync(message);
        }
    }
}
