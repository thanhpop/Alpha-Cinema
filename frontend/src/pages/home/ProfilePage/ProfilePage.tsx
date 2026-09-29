import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Tabs,
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Typography,
  Table,
  Tag,
  message,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  UserOutlined,
  HistoryOutlined,
  MailOutlined,
  SaveOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import type { TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";

import { reservationService } from "@/services/reservationService";
import type { ReservationResponse } from "@/services/reservationService";

const { Content } = Layout;
const { Title, Text } = Typography;

interface UserData {
  userId: number;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
}

interface BookingHistory {
  key: string;
  movieName: string;
  bookingDate: string;
  showDate: string;
  theater: string;
  seats: string;
  total: number;
  status: "success" | "pending" | "cancelled";
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userStr);
    setUser({
      ...parsedUser,
      fullName: parsedUser.fullName || "",
      phone: parsedUser.phone || "",
    });

    setHistoryLoading(true);
    reservationService
      .getReservationsByUserId(parsedUser.userId)
      .then((res) => {
        setReservations(res);
        setBookingHistory(mapReservationToHistory(res));
      })
      .catch(() => {
        message.error("Không thể tải lịch sử đặt vé");
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [navigate]);

  const onFinishUpdateProfile = (values: any) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUser((prev) => ({ ...prev!, ...values }));
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...currentUser, ...values }),
      );
      message.success("Cập nhật thông tin thành công!");
    }, 1000);
  };
  const mapReservationToHistory = (
    reservations: ReservationResponse[],
  ): BookingHistory[] => {
    return reservations.map((r) => ({
      key: r.id,
      movieName: r.movieName,
      // Backend đã format sẵn, chỉ hiển thị.
      bookingDate: r.reservationTime,
      showDate: r.showDateTimeText ?? "-",
      theater: r.theaterName,
      seats: r.seats?.map((s) => s.seatNumber).join(", ") || "",
      total: r.totalPrice,
      status:
        r.statusValue === "CONFIRMED"
          ? "success"
          : r.statusValue === "PENDING"
            ? "pending"
            : "cancelled",
    }));
  };
  const totalTickets = reservations
    .filter((r) => r.statusValue === "CONFIRMED")
    .reduce((sum, r) => sum + (r.seats?.length || 0), 0);
  const totalSpent = reservations
    .filter((r) => r.statusValue === "CONFIRMED")
    .reduce((sum, r) => sum + r.totalPrice, 0);

  const columns: ColumnsType<BookingHistory> = [
    {
      title: "Phim",
      dataIndex: "movieName",
      key: "movieName",
      render: (text) => <span className="font-bold text-blue-600">{text}</span>,
    },
    {
      title: "Ngày chiếu",
      dataIndex: "showDate",
      key: "showDate",
    },
    {
      title: "Rạp",
      dataIndex: "theater",
      key: "theater",
      responsive: ["md"],
    },
    {
      title: "Ghế",
      dataIndex: "seats",
      key: "seats",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      render: (value) => (
        <span className="font-semibold">{value.toLocaleString()} đ</span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "green";
        let text = "Thành công";
        if (status === "pending") {
          color = "orange";
          text = "Chờ thanh toán";
        }
        if (status === "cancelled") {
          color = "red";
          text = "Đã hủy";
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: (
        <span>
          <UserOutlined className="mr-2" />
          Thông tin cá nhân
        </span>
      ),
      children: (
        <Form
          layout="vertical"
          initialValues={user || {}}
          onFinish={onFinishUpdateProfile}
          key={user?.email}
        >
          <Row gutter={24}>
            <Col span={24} md={12}>
              <Form.Item label="Tên đăng nhập" name="username">
                <Input
                  prefix={<UserOutlined />}
                  disabled
                  className="bg-gray-50"
                />
              </Form.Item>
            </Col>
            <Col span={24} md={12}>
              <Form.Item label="Email" name="email">
                <Input
                  prefix={<MailOutlined />}
                  disabled
                  className="bg-gray-50"
                />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            className="bg-blue-600"
          >
            Lưu thay đổi
          </Button>
        </Form>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <HistoryOutlined className="mr-2" />
          Lịch sử đặt vé
        </span>
      ),
      children: (
        <Table
          columns={columns}
          dataSource={bookingHistory}
          loading={historyLoading}
          pagination={{ pageSize: 5 }}
        />
      ),
    },
  ];

  if (!user) return null;

  return (
    <Content className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card className="shadow-sm border-gray-200 text-center">
              <div className="flex flex-col items-center">
                <Avatar
                  size={100}
                  icon={<UserOutlined />}
                  className="bg-blue-100 text-blue-600 mb-4"
                />
                <Title level={4} className="mb-1">
                  {user.username}
                </Title>
                <Text type="secondary" className="mb-4">
                  {user.email}
                </Text>

                <Row gutter={16} className="w-full mt-4 mb-6">
                  <Col span={12}>
                    <Statistic
                      title="Vé đã mua"
                      value={totalTickets}
                      prefix={<HistoryOutlined />}
                      valueStyle={{ fontSize: 18 }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Chi tiêu"
                      value={totalSpent}
                      prefix={<DollarOutlined />}
                      valueStyle={{ fontSize: 18 }}
                      formatter={(value) =>
                        `${Number(value).toLocaleString()} đ`
                      }
                    />
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card className="shadow-sm border-gray-200 min-h-[500px]">
              <Tabs defaultActiveKey="1" items={items} />
            </Card>
          </Col>
        </Row>
      </div>
    </Content>
  );
};

export default ProfilePage;
