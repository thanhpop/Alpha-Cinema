using backend.DTO.Dashboard;
using backend.Helpers;
using backend.Service.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controller
{
    [Authorize(Roles = "ADMIN")]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly IDashboardReportService _dashboardReportService;

        public ReportController(IDashboardService dashboardService, IDashboardReportService dashboardReportService)
        {
            _dashboardService = dashboardService;
            _dashboardReportService = dashboardReportService;
        }

        [HttpGet("dashboard-pdf")]
        public async Task<IActionResult> GetDashboardPdf()
        {
            DashboardResponseDTO data = await _dashboardService.GetDashboardAsync();

            byte[] pdfBytes = _dashboardReportService.ExportDashboardToPdf(data);

            string fileName = $"Bao-cao-doanh-thu-{DateTimeHelper.Now:yyyyMMddHHmm}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
    }
}