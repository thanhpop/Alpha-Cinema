import React, { useRef, useState } from "react";
import { Row, Col, Card, Table, Tag, Typography, Button, message } from "antd";
import {
  BarcodeOutlined,
  DollarCircleOutlined,
  FireOutlined,
  PieChartOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useDashboard } from "@/hooks/useDashboard";
import type { MoviePerformance } from "@/services/dashboardService";
import type { TheaterPerformance } from "@/services/dashboardService";
import { dashboardService } from "@/services/dashboardService";

const { Title, Text } = Typography;

const AdminDashboard: React.FC = () => {
  const { data, loading } = useDashboard();
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    setExporting(true);
    const hide = message.loading("Đang tải báo cáo từ hệ thống...", 0);

    try {
      const blob = await dashboardService.exportPdf();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      const dateString = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `Bao-cao-cinema-${dateString}.pdf`);

      document.body.appendChild(link);
      link.click();

      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);

      message.success("Tải báo cáo thành công!");
    } catch (error) {
      console.error("Export PDF error:", error);
      message.error("Lỗi khi kết nối với máy chủ báo cáo.");
    } finally {
      setExporting(false);
      hide();
    }
  };

  const theaterColumns: ColumnsType<TheaterPerformance> = [
    {
      title: "Tên Rạp",
      dataIndex: "theaterName",
      key: "theaterName",
      render: (text) => <span className="font-bold text-gray-800">{text}</span>,
    },
    {
      title: "Địa Điểm",
      dataIndex: "location",
      key: "location",
      render: (text) => (
        <span className="font-medium text-gray-600">{text}</span>
      ),
    },
    {
      title: "Doanh Thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (value) => (
        <span className="font-bold text-blue-600">
          {value.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: "Tỷ lệ lấp đầy",
      dataIndex: "occupancyRate",
      key: "occupancyRate",
      render: (rate) => {
        return (
          <Tag color="blue" className="font-bold m-0">
            {rate.toFixed(1)}%
          </Tag>
        );
      },
    },
  ];

  const movieInsightColumns: ColumnsType<MoviePerformance> = [
    {
      title: "Tên Phim",
      dataIndex: "movieName",
      key: "movieName",
      render: (text) => (
        <span className="font-bold text-gray-800 line-clamp-1">{text}</span>
      ),
    },
    {
      title: "Số Suất Chiếu",
      dataIndex: "showtimes",
      key: "showtimes",
      render: (val) => (
        <span className="font-medium text-gray-600">
          {val.toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Vé Đã Bán",
      dataIndex: "ticketsSold",
      key: "ticketsSold",
      render: (val) => (
        <span className="font-medium text-gray-600">
          {val.toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Doanh Thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (val) => (
        <span className="font-bold text-blue-600">
          {val.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-100">
          <p className="font-bold text-gray-700 mb-1">{label}</p>
          <p className="text-blue-600 font-semibold">
            Doanh thu: {Number(payload[0].value).toLocaleString("vi-VN")} ₫
          </p>
        </div>
      );
    }
    return null;
  };

  const topMoviesWithPercent = React.useMemo(() => {
    if (!data?.topMovies?.length) return [];

    const maxRevenue = Math.max(
      ...data.topMovies.map((m) => Number(m.revenue)),
    );

    return data.topMovies.map((movie) => ({
      ...movie,
      percent:
        maxRevenue === 0 ? 0 : (Number(movie.revenue) / maxRevenue) * 100,
    }));
  }, [data]);

  return (
    <div className="min-h-screen">
      <div className=" mx-auto">
        <div className="mb-8 ">
          <Title level={3} className="!m-0">
            Báo cáo thống kê
          </Title>
          <div className="flex justify-end mt-4">
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={handleExportPDF}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md"
            >
              Xuất báo cáo
            </Button>
          </div>
        </div>
        <div ref={reportRef} className="bg-gray-50 p-4 rounded-lg">
          <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24} sm={12} xl={6}>
              <Card className="shadow-sm border-none rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-2xl">
                    <DollarCircleOutlined />
                  </div>
                  <div>
                    <Text className="text-gray-500 font-medium">
                      Tổng doanh thu
                    </Text>
                    <Title level={3} className="!m-0 !text-gray-800">
                      {data?.summary.totalRevenue.toLocaleString("vi-VN")} ₫
                    </Title>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="shadow-sm border-none rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-2xl">
                    <BarcodeOutlined />
                  </div>
                  <div>
                    <Text className="text-gray-500 font-medium">Vé đã bán</Text>
                    <Title level={3} className="!m-0 !text-gray-800">
                      {data?.summary.ticketsSold}
                    </Title>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="shadow-sm border-none rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 text-2xl">
                    <FireOutlined />
                  </div>
                  <div>
                    <Text className="text-gray-500 font-medium">
                      Tổng suất chiếu
                    </Text>
                    <Title level={3} className="!m-0 !text-gray-800">
                      {data?.summary.totalShowtimes}
                    </Title>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card className="shadow-sm border-none rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 text-2xl">
                    <PieChartOutlined />
                  </div>
                  <div>
                    <Text className="text-gray-500 font-medium">
                      Tỷ lệ lấp đầy
                    </Text>
                    <Title level={3} className="!m-0 !text-gray-800">
                      {data?.summary.occupancyRate.toFixed(1)}%
                    </Title>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} xl={16}>
              <Card
                title={
                  <span className="font-bold text-gray-800">
                    Biểu đồ doanh thu 7 ngày qua
                  </span>
                }
                className="shadow-sm border-none rounded-xl h-full"
              >
                <div style={{ width: "100%", height: 350 }}>
                  <ResponsiveContainer>
                    <AreaChart
                      data={data?.revenueChart || []}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1677ff"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#1677ff"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280" }}
                        dy={10}
                      />
                      <YAxis
                        width={100}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6b7280" }}
                        tickFormatter={(val) =>
                          `${Number(val).toLocaleString("vi-VN")} ₫`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#1677ff"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <Card
                title={
                  <span className="font-bold text-gray-800">
                    Top 5 Phim Doanh Thu Cao Nhất
                  </span>
                }
                className="shadow-sm border-none rounded-xl h-full"
              >
                <div className="space-y-6 mt-2">
                  {topMoviesWithPercent.map((movie, index) => (
                    <div key={movie.id} className="flex items-center gap-4">
                      <span className="font-black text-2xl text-gray-300 w-3 text-center">
                        {index + 1}
                      </span>
                      <img
                        src={movie.image}
                        alt="movie"
                        className="w-12 h-16 object-cover rounded-md shadow-sm"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 line-clamp-1 mb-1">
                          {movie.title}
                        </h4>
                        <p className="text-sm text-gray-500 mb-1">
                          Doanh thu:{" "}
                          <span className="font-bold text-blue-600">
                            {Number(movie.revenue).toLocaleString("vi-VN")} ₫
                          </span>
                        </p>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${movie.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                title={
                  <span className="font-bold text-gray-800">
                    Hiệu Suất Rạp Chiếu
                  </span>
                }
                className="shadow-sm border-none rounded-xl h-full"
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  columns={theaterColumns}
                  rowKey="theaterName"
                  dataSource={data?.theaterPerformance || []}
                  pagination={false}
                  scroll={{ x: 500 }}
                />
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                title={
                  <span className="font-bold text-gray-800">
                    Hiệu Suất phim
                  </span>
                }
                className="shadow-sm border-none rounded-xl h-full"
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  columns={movieInsightColumns}
                  dataSource={data?.moviePerformance || []}
                  rowKey="movieName"
                  pagination={false}
                  scroll={{ x: 500 }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
