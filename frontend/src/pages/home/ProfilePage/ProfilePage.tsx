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
  Select,
  DatePicker,
} from "antd";
import {
  UserOutlined,
  HistoryOutlined,
  MailOutlined,
  SaveOutlined,
  DollarOutlined,
  PhoneOutlined,
  LockOutlined,
} from "@ant-design/icons";
import type { TabsProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";

import {
  userService,
  GENDER_OPTIONS,
  PHONE_PATTERN,
} from "@/services/userService";
import type { Gender, UserProfile } from "@/services/userService";
import { authService } from "@/services/authService";
import type { ChangePasswordPayload } from "@/types/Auth";
import { getErrorMessage } from "@/utils/getErrorMessage";

import { reservationService } from "@/services/reservationService";
import type {
  ReservationResponse,
  UserReservationSummary,
} from "@/services/reservationService";
import { usePagedList } from "@/hooks/usePagedList";

const { Content } = Layout;
const { Title, Text } = Typography;

interface ProfileFormValues {
  username: string;
  email: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: Dayjs | null;
}

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 100;
const POSTER_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='72'><rect width='100%' height='100%' fill='%23e6e6e6'/></svg>";

const toFormValues = (u: UserProfile): ProfileFormValues => ({
  username: u.username,
  email: u.email,
  phone: u.phone ?? "",
  gender: u.gender ?? undefined,
  dateOfBirth: u.dateOfBirthIso ? dayjs(u.dateOfBirthIso) : null,
});

interface BookingHistory {
  key: string;
  movieName: string;
  moviePoster: string | null;
  bookingDate: string;
  showDate: string;
  theater: string;
  seats: string;
  total: number;
  status: "success" | "pending" | "cancelled";
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm<ChangePasswordPayload>();
  const [changingPassword, setChangingPassword] = useState(false);
  const {
    items: reservations,
    loading: historyLoading,
    pagination,
    setFilters,
  } = usePagedList(reservationService.getMyReservations, {
    initialFilters: { search: "" },
    initialPageSize: 5,
    onError: () => message.error("Không thể tải lịch sử đặt vé"),
  });
  const [summary, setSummary] = useState<UserReservationSummary>({
    totalTickets: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    reservationService
      .getMySummary()
      .then(setSummary)
      .catch(() => message.error("Không thể tải thống kê đặt vé"));
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/login");
      return;
    }

    userService
      .getMe()
      .then(setUser)
      .catch(() => {
        message.error("Không thể tải thông tin cá nhân");
        const stored = JSON.parse(userStr);
        setUser({
          id: stored.userId,
          username: stored.username,
          email: stored.email,
          phone: null,
          gender: null,
          dateOfBirth: null,
          dateOfBirthIso: null,
        });
      });
  }, [navigate]);

  const onFinishUpdateProfile = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      const updated = await userService.updateMe({
        phone: values.phone?.trim() || null,
        gender: values.gender ?? null,
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD") ?? null,
      });
      setUser(updated);
      message.success("Cập nhật thông tin thành công!");
    } catch (err) {
      message.error(getErrorMessage(err, "Cập nhật thông tin thất bại"));
    } finally {
      setLoading(false);
    }
  };

  const onFinishChangePassword = async (values: ChangePasswordPayload) => {
    setChangingPassword(true);
    try {
      const msg = await authService.changePassword(values);
      message.success(msg || "Đổi mật khẩu thành công!");
      passwordForm.resetFields();
    } catch (err) {
      message.error(getErrorMessage(err, "Đổi mật khẩu thất bại"));
    } finally {
      setChangingPassword(false);
    }
  };
  const mapReservationToHistory = (
    reservations: ReservationResponse[],
  ): BookingHistory[] => {
    return reservations.map((r) => ({
      key: r.id,
      movieName: r.movieName,
      moviePoster: r.moviePoster,
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
  const bookingHistory = mapReservationToHistory(reservations);
  const { totalTickets, totalSpent } = summary;

  const columns: ColumnsType<BookingHistory> = [
    {
      title: "Phim",
      dataIndex: "movieName",
      key: "movieName",
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <img
            src={record.moviePoster || POSTER_FALLBACK}
            alt={text}
            className="w-12 h-[72px] object-cover rounded shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = POSTER_FALLBACK;
            }}
          />
          <span className="font-bold text-blue-600">{text}</span>
        </div>
      ),
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
        <Form<ProfileFormValues>
          layout="vertical"
          initialValues={user ? toFormValues(user) : {}}
          onFinish={onFinishUpdateProfile}
          key={user?.id}
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
            <Col span={24} md={12}>
              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  {
                    pattern: PHONE_PATTERN,
                    message: "Số điện thoại không hợp lệ (VD: 0912345678)",
                  },
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="VD: 0912345678" />
              </Form.Item>
            </Col>
            <Col span={24} md={12}>
              <Form.Item label="Giới tính" name="gender">
                <Select
                  placeholder="Chọn giới tính"
                  options={GENDER_OPTIONS}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={24} md={12}>
              <Form.Item label="Ngày sinh" name="dateOfBirth">
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày sinh"
                  disabledDate={(d) => d.isAfter(dayjs(), "day")}
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
        <>
          <Input.Search
            placeholder="Tìm theo tên phim, rạp hoặc mã đặt vé"
            allowClear
            enterButton
            onSearch={(v) => setFilters({ search: v })}
            className="mb-4 max-w-md"
          />
          <Table
            columns={columns}
            dataSource={bookingHistory}
            loading={historyLoading}
            pagination={pagination}
          />
        </>
      ),
    },
    {
      key: "3",
      label: (
        <span>
          <LockOutlined className="mr-2" />
          Đổi mật khẩu
        </span>
      ),
      children: (
        <Form<ChangePasswordPayload>
          form={passwordForm}
          layout="vertical"
          onFinish={onFinishChangePassword}
          className="max-w-md"
        >
          <Form.Item
            label="Mật khẩu hiện tại"
            name="currentPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            dependencies={["currentPassword"]}
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới" },
              {
                min: PASSWORD_MIN_LENGTH,
                max: PASSWORD_MAX_LENGTH,
                message: `Mật khẩu phải từ ${PASSWORD_MIN_LENGTH} đến ${PASSWORD_MAX_LENGTH} ký tự`,
              },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  value && value === getFieldValue("currentPassword")
                    ? Promise.reject(
                        new Error("Mật khẩu mới phải khác mật khẩu hiện tại"),
                      )
                    : Promise.resolve(),
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
            />
          </Form.Item>
          <Form.Item
            label="Nhập lại mật khẩu mới"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng nhập lại mật khẩu mới" },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || value === getFieldValue("newPassword")
                    ? Promise.resolve()
                    : Promise.reject(new Error("Mật khẩu xác nhận không khớp")),
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={changingPassword}
            className="bg-blue-600"
          >
            Đổi mật khẩu
          </Button>
        </Form>
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
