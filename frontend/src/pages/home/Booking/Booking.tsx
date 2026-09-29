import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Button,
  Row,
  Col,
  Card,
  Divider,
  message,
  Typography,
  Steps,
  Radio,
} from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

import { showtimeService } from "@/services/showtimeService";
import movieService from "@/services/movieService";
import theaterService from "@/services/theaterService";

import { reservationService } from "@/services/reservationService";
import { paymentService } from "@/services/paymentService";
import { seatSessionService } from "@/services/seatSessionService";
import { seatService } from "@/services/seatService";
import type { Seat } from "@/types/Seat";
import { createSeatStream } from "@/services/seatStreamService";

const { Content } = Layout;
const { Text, Title } = Typography;

const paymentMethods = [
  {
    id: "vnpay",
    name: "VNPay",
    icon: "https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png",
    color: "#005baa",
  },
];

const BookingPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showtime, setShowtime] = useState<any>(null);
  const [movie, setMovie] = useState<any>(null);
  const [theater, setTheater] = useState<any>(null);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [holdSeatIds, setHoldSeatIds] = useState<number[]>([]);

  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<{
    name: string;
    email: string;
  }>({
    name: "",
    email: "",
  });

  const [expireAt, setExpireAt] = useState<string | null>(null);
  const [serverOffset, setServerOffset] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  useEffect(() => {
    if (!showtimeId) return;

    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    const startSession = async () => {
      const data = await seatSessionService.startSession(
        Number(showtimeId),
        user.userId,
      );

      if (data.expireAt) {
        setExpireAt(data.expireAt);

        const offset = new Date(data.serverTime).getTime() - Date.now();

        setServerOffset(offset);
      }
    };

    startSession();
  }, [showtimeId]);
  useEffect(() => {
    if (!showtimeId) return;

    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = createSeatStream(Number(showtimeId));

      eventSource.onopen = () => {
        console.log("Seat stream connected");
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        setHoldSeatIds(data.holdSeatIds || []);

        setSeats((prev) =>
          prev.map((seat) => ({
            ...seat,
            isReserved: data.soldSeatIds?.includes(seat.id)
              ? true
              : seat.isReserved,
          })),
        );
      };

      eventSource.onerror = () => {
        console.warn("Seat stream disconnected. Reconnecting...");
        eventSource?.close();
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, [showtimeId]);
  useEffect(() => {
    if (!showtimeId) return;

    const loadSeatStatus = async () => {
      try {
        const data = await seatService.getSeatStatus(Number(showtimeId));
        setHoldSeatIds(data);
      } catch (err) {
        console.error("Không load được seat status");
      }
    };

    loadSeatStatus();
  }, [showtimeId]);

  useEffect(() => {
    if (!expireAt) return;

    const interval = setInterval(() => {
      const now = Date.now() + serverOffset;
      const diff = Math.floor((new Date(expireAt).getTime() - now) / 1000);

      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);

        message.warning("Hết thời gian giữ ghế!");
        setTimeout(() => {
          navigate("/");
        }, 900);
        setSelectedSeats([]);
        return;
      }

      setTimeLeft(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [expireAt, serverOffset, navigate]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");

    if (!userStr) {
      setContactInfo({
        name: "",
        email: "",
      });
      return;
    }

    try {
      const user = JSON.parse(userStr);

      setContactInfo({
        name: user.username ?? "",
        email: user.email ?? "",
      });
    } catch (err) {
      localStorage.removeItem("user");
      setContactInfo({
        name: "",
        email: "",
      });
    }
  }, []);

  useEffect(() => {
    if (!showtimeId) return;

    const fetchData = async () => {
      try {
        const st = await showtimeService.getById(Number(showtimeId));
        setShowtime(st);
        setSeats(sortSeats(st.seats ?? []));
        const [movieData, theaterData] = await Promise.all([
          movieService.getMovieById(st.movieId),
          theaterService.getById(st.theaterId),
        ]);

        setMovie(movieData);
        setTheater(theaterData);
      } catch (err) {
        message.error("Không tải được dữ liệu suất chiếu");
      }
    };

    fetchData();
  }, [showtimeId]);
  useEffect(() => {
    if (!showtimeId) return;
    if (seats.length === 0) return;
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    const loadSnapshot = async () => {
      try {
        const data = await seatSessionService.getSnapshot(
          Number(showtimeId),
          user.userId,
        );

        setHoldSeatIds(data.holdSeats || []);

        const mySeatIds: number[] = data.mySeats || [];

        setSelectedSeats(seats.filter((s) => mySeatIds.includes(s.id)));

        if (data.expireAt) {
          setExpireAt(data.expireAt);

          const offset = new Date(data.serverTime).getTime() - Date.now();

          setServerOffset(offset);
        }
      } catch (err) {
        console.error("Snapshot load failed");
      }
    };

    loadSnapshot();
  }, [showtimeId, seats]);

  const sortSeats = (seats: Seat[]) => {
    return [...seats].sort((a, b) => {
      const rowA = a.seatNumber.charAt(0);
      const rowB = b.seatNumber.charAt(0);

      const colA = parseInt(a.seatNumber.slice(1), 10);
      const colB = parseInt(b.seatNumber.slice(1), 10);

      if (rowA !== rowB) {
        return rowA.localeCompare(rowB);
      }
      return colA - colB;
    });
  };

  const handleSeatClick = async (seat: Seat) => {
    const isSelected = selectedSeats.some((s) => s.id === seat.id);
    const isHeldByOthers = holdSeatIds.includes(seat.id) && !isSelected;
    if (seat.isReserved || isHeldByOthers) return;

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      message.error("Vui lòng đăng nhập");
      return;
    }

    const user = JSON.parse(userStr);

    try {
      if (isSelected) {
        await seatSessionService.removeSeats(Number(showtimeId), user.userId, [
          seat.id,
        ]);

        setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
      } else {
        if (selectedSeats.length >= 8) {
          message.warning("Bạn chỉ được chọn tối đa 8 ghế!");
          return;
        }

        await seatSessionService.addSeats(Number(showtimeId), user.userId, [
          seat.id,
        ]);

        setSelectedSeats((prev) => [...prev, seat]);
      }
    } catch (err) {
      message.error("Không thể giữ ghế");
    }
  };

  const ticketPrice = showtime?.price ?? 0;
  const totalPrice = selectedSeats.length * ticketPrice;

  const handleAction = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!selectedPayment) {
      message.error("Vui lòng chọn phương thức thanh toán!");
      return;
    }

    try {
      message.loading({ content: "Đang đặt ghế...", key: "payment" });

      const userStr = localStorage.getItem("user");
      if (!userStr) {
        message.error("Vui lòng đăng nhập!");
        return;
      }

      const user = JSON.parse(userStr);

      const reservation = await reservationService.createReservation({
        userId: user.userId,
        showtimeId: Number(showtimeId),
        seatIds: selectedSeats.map((s) => s.id),
      });

      const paymentUrl = await paymentService.createVnPayPayment({
        reservationId: reservation.id,
        amount: reservation.totalPrice,
      });

      message.success({
        content: "Chuyển hướng đến VNPay...",
        key: "payment",
      });

      window.location.href = paymentUrl;
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Thanh toán thất bại");
    }
  };

  return (
    <Content className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() =>
              currentStep === 1 ? navigate(-1) : setCurrentStep(1)
            }
            className="border-none bg-transparent shadow-none hover:bg-gray-200 text-gray-500 pl-0 font-semibold text-lg"
          >
            {currentStep === 1 ? "Quay lại" : "Trở lại chọn ghế"}
          </Button>

          <div className="hidden md:block w-1/3">
            <Steps
              current={currentStep - 1}
              items={[
                { title: "Chọn ghế", icon: <UserOutlined /> },
                { title: "Thanh toán", icon: <CreditCardOutlined /> },
              ]}
            />
          </div>
          <div className="w-20"></div>
        </div>

        <Row gutter={32}>
          <Col xs={24} lg={16}>
            {currentStep === 1 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 min-h-[800px] animate-fade-in">
                <div className="flex flex-col items-center mb-16 px-12">
                  <div className="w-full h-2 bg-gray-400 rounded shadow-md relative z-10"></div>
                  <div
                    className="w-full h-16 bg-gradient-to-b from-gray-200 to-transparent opacity-50"
                    style={{
                      clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
                    }}
                  ></div>
                  <Text className="text-gray-400 mt-4 text-sm font-bold">
                    MÀN HÌNH
                  </Text>
                </div>

                <div className="flex justify-center overflow-x-auto pb-8">
                  <div className="grid grid-cols-10 gap-2 md:gap-3">
                    {seats.map((seat) => {
                      const isSelected = selectedSeats.some(
                        (s) => s.id === seat.id,
                      );
                      const isHeldByOthers =
                        holdSeatIds.includes(seat.id) && !isSelected;

                      return (
                        <div
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          className={`
        w-9 h-9 md:w-11 md:h-11 rounded-t-lg text-[10px] md:text-xs font-bold flex items-center justify-center cursor-pointer transition-all duration-200 select-none shadow-sm border
        ${
          seat.isReserved
            ? "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
            : isSelected
              ? "!bg-[rgb(3,89,157)] !border-[rgb(3,89,157)] text-white transform scale-110 shadow-lg z-10"
              : isHeldByOthers
                ? "bg-[rgb(63,183,249)] border-blue-400 text-white cursor-not-allowed pointer-events-none"
                : "bg-white border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-400"
        }
      `}
                        >
                          {seat.seatNumber}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mt-12 border-t border-gray-300 pt-8 gap-4">
                  <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border border-gray-300 bg-white"></div>
                      <span className="text-sm text-gray-500">Ghế thường</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[rgb(3,89,157)] border border-blue-600"></div>
                      <span className="text-sm text-gray-500">Đang chọn</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[rgb(63,183,249)] border border-blue-400"></div>
                      <span className="text-sm text-gray-500">Đang giữ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-300 border border-gray-300 text-center text-xs text-gray-500 font-bold leading-6 flex items-center justify-center"></div>
                      <span className="text-sm text-gray-500">Đã đặt</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-black-600 bg-white-50 px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
                    <ClockCircleOutlined className="text-lg" />
                    <span className="text-sm font-medium">
                      Thời gian còn lại:
                    </span>
                    <span className="text-xl font-bold font-mono">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <Title
                      level={4}
                      className="border-l-4 border-blue-600 pl-3 m-0"
                    >
                      Thông tin khách hàng
                    </Title>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="col-span-1 md:col-span-2 border-b pb-4 border-gray-100">
                      <Text className="block text-gray-400 text-xs uppercase font-bold mb-1 tracking-wider">
                        Họ và tên
                      </Text>
                      <div className="text-xl font-bold text-gray-800">
                        {contactInfo.name}
                      </div>
                    </div>
                    <div>
                      <Text className="block text-gray-400 text-xs uppercase font-bold mb-1 tracking-wider">
                        Số điện thoại
                      </Text>
                      <div className="text-lg font-semibold text-gray-800 tracking-wide">
                        9999999999
                      </div>
                    </div>
                    <div>
                      <Text className="block text-gray-400 text-xs uppercase font-bold mb-1 tracking-wider">
                        Email
                      </Text>
                      <div className="text-lg font-semibold text-gray-800">
                        {contactInfo.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                  <Title
                    level={4}
                    className="mb-6 border-l-4 border-blue-600 pl-3"
                  >
                    Phương thức thanh toán
                  </Title>
                  <div className="grid grid-cols-1 gap-4">
                    {" "}
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`cursor-pointer border rounded-lg p-4 flex items-center gap-4 transition-all duration-200 ${
                          selectedPayment === method.id
                            ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-md"
                            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        <div className="w-16 h-10 flex-shrink-0 flex items-center justify-center">
                          <img
                            src={method.icon}
                            alt={method.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 text-lg">
                            {method.name}
                          </div>
                          <div className="text-gray-500 text-sm">
                            Quét mã QR qua ứng dụng ngân hàng hoặc ví VNPay
                          </div>
                        </div>
                        <Radio checked={selectedPayment === method.id} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-black-500">
                    <ClockCircleOutlined className="text-xl" />
                    <span className="font-bold text-lg">
                      Thời gian còn lại:
                    </span>
                  </div>
                  <span className="text-2xl font-black text-black-600 font-mono">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            )}
          </Col>

          <Col xs={24} lg={8}>
            <div className="sticky top-24 z-10">
              <Card
                className="shadow-xl border-0 rounded-xl overflow-hidden"
                bodyStyle={{ padding: 0 }}
              >
                <div className="p-6 border-b border-gray-100 flex gap-4 bg-white">
                  <img
                    src={movie?.poster}
                    alt="poster"
                    className="w-36 h-52 object-cover rounded-lg shadow-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-gray-800 line-clamp-2 mb-1">
                      {movie?.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 bg-white space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      <EnvironmentOutlined className="mr-2" /> Rạp
                    </span>
                    <span className="text-gray-900 font-bold text-right">
                      {theater?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      <CalendarOutlined className="mr-2" /> Suất chiếu
                    </span>
                    <div className="text-right">
                      <span className="block text-gray-900 font-bold text-lg leading-none mb-1">
                        {showtime?.showTime}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {showtime?.showDate}
                      </span>
                    </div>
                  </div>
                  <Divider className="my-2 border-dashed" />
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 font-medium pt-1">
                      Ghế chọn
                    </span>
                    <div className="flex flex-wrap justify-end gap-2 w-[70%]">
                      {selectedSeats.length > 0 ? (
                        selectedSeats.map((s) => (
                          <span
                            key={s.id}
                            className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs border border-blue-100"
                          >
                            {s.seatNumber}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs pt-1">
                          Chưa chọn ghế
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-gray-600 font-medium">Tổng cộng</span>
                    <span className="text-2xl font-black text-blue-500 tracking-tight">
                      {totalPrice.toLocaleString("vi-VN")} vnđ
                    </span>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    block
                    className={`h-14 text-lg font-bold rounded-xl shadow-lg transition-all duration-300 ${
                      currentStep === 1
                        ? "bg-blue-600 hover:bg-blue-500 shadow-blue-200"
                        : "bg-red-600 hover:bg-red-500 shadow-red-200"
                    }`}
                    disabled={selectedSeats.length === 0}
                    onClick={handleAction}
                  >
                    {currentStep === 1 ? "TIẾP TỤC" : "THANH TOÁN"}
                  </Button>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      </div>
    </Content>
  );
};

export default BookingPage;
