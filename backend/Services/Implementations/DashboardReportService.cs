using backend.DTO.Dashboard;
using backend.Helpers;
using backend.Service.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ScottPlot;
using ScottPlot.TickGenerators;

namespace backend.Service.Implementations
{
    public class DashboardReportService : IDashboardReportService
    {
        public byte[] ExportDashboardToPdf(DashboardResponseDTO data)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            byte[] chartBytes = GenerateChartImage(data.RevenueChart);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.PageColor(QuestPDF.Helpers.Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(QuestPDF.Helpers.Fonts.Verdana));

                    page.Header().Background(QuestPDF.Helpers.Colors.Blue.Medium)
                        .PaddingHorizontal(20)
                        .PaddingVertical(15)
                         .Column(col =>
                         {
                             col.Item().Text("BÁO CÁO TỔNG QUAN ALPHA CINEMA")
                                 .FontSize(18).SemiBold().FontColor(QuestPDF.Helpers.Colors.White);

                             col.Item().AlignRight().Text(txt =>
                             {
                                 txt.Span($"Ngày xuất báo cáo: {DateTimeHelper.Now:dd/MM/yyyy HH:mm}")
                                    .Italic().FontSize(9).FontColor(QuestPDF.Helpers.Colors.White);
                             });
                         });

                    page.Content()
                        .PaddingHorizontal(20)
                        .PaddingVertical(20)
                        .Column(col =>
                        {
                            col.Item().Element(c => SectionHeader(c, "CHỈ SỐ TỔNG QUAN"));
                            col.Item().PaddingTop(5).Row(row =>
                            {
                                row.RelativeItem().Element(c => SummaryCard(c, "Tổng Doanh Thu", $"{data.Summary.TotalRevenue:N0} đ"));
                                row.ConstantItem(12);
                                row.RelativeItem().Element(c => SummaryCard(c, "Vé Đã Bán", data.Summary.TicketsSold.ToString("N0")));
                                row.ConstantItem(12);
                                row.RelativeItem().Element(c => SummaryCard(c, "Suất Chiếu", data.Summary.TotalShowtimes.ToString("N0")));
                                row.ConstantItem(12);
                                row.RelativeItem().Element(c => SummaryCard(c, "Tỷ Lệ Lấp Đầy", $"{data.Summary.OccupancyRate:F1}%"));
                            });

                            col.Item().PaddingTop(15).Element(c => SectionHeader(c, "BIỂU ĐỒ DOANH THU 7 NGÀY QUA"));

                            col.Item().PaddingTop(10).AlignCenter().Width(515).Image(chartBytes);

                            col.Item().PaddingTop(12).Element(c => SectionHeader(c, "TOP 5 PHIM DOANH THU CAO NHẤT"));
                            col.Item().PaddingTop(15).Column(list =>
                            {
                                decimal maxRevenue = data.TopMovies.Any() ? data.TopMovies.Max(x => x.Revenue) : 1;
                                if (maxRevenue <= 0) maxRevenue = 1;

                                int index = 1;
                                foreach (var movie in data.TopMovies.Take(5))
                                {
                                    list.Item().PaddingVertical(8).Column(rowItem =>
                                    {
                                        rowItem.Item().Row(row =>
                                        {
                                            row.ConstantItem(25).Text($"{index++}.").FontSize(11).Bold().FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                            row.RelativeItem().Text(movie.Title).FontSize(9.5f).Bold();
                                            row.RelativeItem().AlignRight().Text($"{movie.Revenue:N0} đ").FontSize(9.5f).Bold().FontColor(QuestPDF.Helpers.Colors.Blue.Medium);
                                        });

                                        float ratio = (float)(movie.Revenue / maxRevenue);

                                        rowItem.Item().PaddingTop(4).PaddingLeft(25).Height(6).Background(QuestPDF.Helpers.Colors.Grey.Lighten4).Row(barRow =>
                                        {
                                            barRow.RelativeItem(Math.Max(ratio, 0.0001f)).Background(QuestPDF.Helpers.Colors.Blue.Medium);
                                            barRow.RelativeItem(Math.Max(1 - ratio, 0.0001f));
                                        });
                                    });

                                    if (index <= 5)
                                        list.Item().LineHorizontal(0.5f).LineColor(QuestPDF.Helpers.Colors.Grey.Lighten3);
                                }
                            });
                        });

                    page.Footer()
                        .PaddingHorizontal(20)
                        .PaddingVertical(20)
                        .Column(footCol =>
                        {
                            footCol.Item().BorderTop(1).BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2).PaddingTop(10).Row(row =>
                            {
                                row.RelativeItem().Text($"© {DateTimeHelper.Now.Year} Alpha Cinema Management System")
                                    .FontSize(9).FontColor(QuestPDF.Helpers.Colors.Grey.Medium);

                                row.RelativeItem().AlignRight().Text(x =>
                                {
                                    x.Span("Trang ").FontSize(9).FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                    x.CurrentPageNumber().FontSize(9).FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                    x.Span(" / ").FontSize(9).FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                    x.TotalPages().FontSize(9).FontColor(QuestPDF.Helpers.Colors.Grey.Medium);
                                });
                            });
                        });
                });
            });

            return document.GeneratePdf();
        }
        private void SectionHeader(IContainer container, string title)
        {
            container.Background(QuestPDF.Helpers.Colors.Grey.Lighten5) 
                .Row(row =>
                {
                    row.ConstantItem(4)
                        .Background(QuestPDF.Helpers.Colors.Blue.Darken3);

                    row.RelativeItem()
                        .PaddingVertical(5)
                        .PaddingHorizontal(10)
                        .Text(title.ToUpper())
                        .FontSize(11)
                        .SemiBold()
                        .FontColor(QuestPDF.Helpers.Colors.Blue.Darken3);
                });
        }

        private byte[] GenerateChartImage(List<RevenueChartDTO> points)
        {
            var plt = new ScottPlot.Plot();
            double[] ys = points.Select(p => (double)p.Revenue).ToArray();
            double[] xs = Enumerable.Range(0, ys.Length).Select(i => (double)i).ToArray();

            var sp = plt.Add.Scatter(xs, ys);
            sp.LineWidth = 4;
            sp.MarkerSize = 12;
            sp.Color = ScottPlot.Color.FromHex("#1677ff");
            sp.FillY = true;
            sp.FillYColor = ScottPlot.Color.FromHex("#1677ff").WithAlpha(0.15f);
            sp.LegendText = "Doanh thu thực tế (VNĐ)"; 

            if (points.Count > 0)
                plt.Axes.SetLimitsX(-0.5, points.Count - 0.5);

            Tick[] ticks = points.Select((p, i) => new Tick(i, p.Date)).ToArray();
            plt.Axes.Bottom.TickGenerator = new NumericManual(ticks);
            plt.Axes.Bottom.Label.Text = "Ngày báo cáo";
            plt.Axes.Bottom.Label.FontSize = 18;
            plt.Axes.Bottom.Label.Bold = true;
            plt.Axes.Bottom.TickLabelStyle.FontSize = 14;

 
            plt.Axes.Left.Label.Text = "Số tiền (VNĐ)";
            plt.Axes.Left.Label.FontSize = 18;
            plt.Axes.Left.Label.Bold = true;
            plt.Axes.Left.TickLabelStyle.FontSize = 14;
            plt.Axes.Left.TickGenerator = new ScottPlot.TickGenerators.NumericAutomatic();

            plt.ShowLegend(Alignment.LowerCenter);
            plt.Legend.Orientation = Orientation.Horizontal;
            plt.Legend.FontSize = 16;
            plt.Legend.BackgroundColor = ScottPlot.Color.FromHex("#FFFFFF");
            plt.Legend.OutlineStyle.Color = ScottPlot.Color.FromHex("#000000");
            plt.Legend.OutlineStyle.Width = 1.5f;

            plt.Layout.Fixed(new PixelPadding(110, 30, 150, 30));

            plt.Legend.Margin = new PixelPadding(0, 0, -115, 0);

            plt.Grid.MajorLineColor = ScottPlot.Color.FromHex("#f1f5f9");
            plt.Axes.Right.IsVisible = false;
            plt.Axes.Top.IsVisible = false;
            plt.FigureBackground.Color = ScottPlot.Color.FromHex("#ffffff");

            return plt.GetImageBytes(1200, 650, ScottPlot.ImageFormat.Png); 
        }
        private void SummaryCard(IContainer container, string title, string value)
        {
            container
                .Border(1) 
                .BorderColor(QuestPDF.Helpers.Colors.Grey.Lighten2) 
                .Background(QuestPDF.Helpers.Colors.White) 
                .Padding(14)
                .Column(col =>
                {
                    col.Item().Text(title.ToUpper())
                        .FontSize(8)
                        .SemiBold()
                        .FontColor(QuestPDF.Helpers.Colors.Grey.Darken1);

                    col.Item().PaddingTop(4).Text(value)
                        .FontSize(11)
                        .Bold()
                        .FontColor(QuestPDF.Helpers.Colors.Black);
                });
        }
    }
}