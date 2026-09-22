import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Button,
  Tag,
  Row,
  Col,
  Typography,
  Divider,
  Spin,
  Empty,
  Modal,
} from "antd";
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import movieService from "@/services/movieService";
import type { Movie } from "@/types/Movie";

import { showtimeService } from "@/services/showtimeService";
import type { Showtime } from "@/types/Showtime";

import theaterService from "@/services/theaterService";
import type { Theater } from "@/types/Theater";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

interface UITheater {
  id: number;
  name: string;
  location: string;
  showtimes: { id: number; time: string }[];
}

interface UISchedule {
  dateKey: string;
  displayDate: string;
  theaters: UITheater[];
}

/**
 * Đổi một Date của trình duyệt sang khoá yyyy-MM-dd theo giờ địa phương,
 * trùng định dạng showDateIso mà backend trả về.
 */
const toDateKey = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const MovieDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<UISchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [movieData, showtimesData, theatersData] = await Promise.all([
          movieService.getMovieById(Number(id)),
          showtimeService.getByMovie(Number(id)),
          theaterService.getTheaters(),
        ]);

        setMovie(movieData);

        const theaterMapData = theatersData.reduce(
          (acc, t) => {
            acc[t.id] = t;
            return acc;
          },
          {} as Record<number, Theater>,
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 6);

        // showDateIso (yyyy-MM-dd) do backend trả về, so sánh chuỗi là đủ và không lệch múi giờ.
        const startKey = toDateKey(today);
        const endKey = toDateKey(endDate);
        const filteredShowtimes = showtimesData.filter(
          (st) => st.showDateIso >= startKey && st.showDateIso <= endKey,
        );

        const processedData = processShowtimesToSchedule(
          filteredShowtimes,
          theaterMapData,
        );

        setSchedules(processedData);
        setSelectedDate(generateNext7Days()[0]);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getEmbedUrl = (url: string | undefined) => {
    if (!url) return "";
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return url;
  };
  const generateNext7Days = () => {
    const days: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(toDateKey(d));
    }

    return days;
  };
  const handleShowtimeClick = (showtimeId: number) => {
    const userStr = localStorage.getItem("user");

    if (!userStr) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);

      if (!user.userId) {
        navigate("/login");
        return;
      }

      navigate(`/booking/${showtimeId}`);
    } catch (err) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const processShowtimesToSchedule = (
    showtimes: Showtime[],
    theaters: Record<number, Theater>,
  ): UISchedule[] => {
    const days = generateNext7Days();

    const showtimeMap: Record<string, Showtime[]> = {};
    showtimes.forEach((st) => {
      const dateKey = st.showDateIso;
      if (!showtimeMap[dateKey]) showtimeMap[dateKey] = [];
      showtimeMap[dateKey].push(st);
    });

    return days.map((dateKey) => {
      const [, month, day] = dateKey.split("-");
      const displayDate = `${day}/${month}`;

      const theaterMap: Record<number, UITheater> = {};

      (showtimeMap[dateKey] || []).forEach((st) => {
        if (!theaterMap[st.theaterId]) {
          const info = theaters[st.theaterId];
          theaterMap[st.theaterId] = {
            id: st.theaterId,
            name: info?.name ?? "Đang cập nhật",
            location: info?.location ?? "",
            showtimes: [],
          };
        }

        const [h, m] = st.showTime.split(":");
        theaterMap[st.theaterId].showtimes.push({
          id: st.id,
          time: `${h}:${m}`,
        });
      });

      return {
        dateKey,
        displayDate,
        theaters: Object.values(theaterMap),
      };
    });
  };

  const currentSchedule = schedules.find((s) => s.dateKey === selectedDate);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  if (!movie)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Empty description="Không tìm thấy phim" />
      </div>
    );

  return (
    <Content>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          className="text-gray-500 mb-8 hover:text-blue-600 font-bold text-lg pl-0"
          onClick={() => navigate(-1)}
        >
          Quay lại
        </Button>

        <Row gutter={[48, 24]}>
          <Col xs={24} md={8} lg={6}>
            <div className="rounded-lg overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-105">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-auto object-cover"
              />
            </div>
          </Col>

          <Col xs={24} md={16} lg={18}>
            <div className="space-y-6">
              <div>
                <Title className="!text-gray-900 text-4xl md:text-5xl font-black mb-3 tracking-tight">
                  {movie.title}
                </Title>
                <div className="flex items-center gap-6 text-gray-500 text-lg font-medium mb-4">
                  <span>
                    <ClockCircleOutlined className="mr-2" />
                    {movie.duration} phút
                  </span>
                  <span>
                    <CalendarOutlined className="mr-2" />
                    2025
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 font-bold text-lg">
                    Thể loại:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {movie.genres?.map((genre) => (
                      <Tag
                        key={genre}
                        color="blue"
                        className="text-base px-3 py-1 font-medium m-0 border-none bg-blue-50 text-blue-700"
                      >
                        {genre}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>

              <Paragraph className="text-gray-600 text-lg leading-relaxed max-w-3xl">
                {movie.overview}
              </Paragraph>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={() => setIsModalOpen(true)}
                  className="h-14 px-8 text-xl font-bold rounded-xl text-gray-700 border-2 border-gray-300 hover:!border-blue-600 hover:!text-blue-600 transition-colors"
                >
                  Xem Trailer
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        <div id="showtimes" className="mt-20">
          <Title
            level={3}
            className="!text-gray-900 border-l-4 border-blue-600 pl-4 uppercase !mb-8"
          >
            Lịch Chiếu
          </Title>

          {schedules.length > 0 ? (
            <>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-2 mb-6 scrollbar-hide">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.dateKey}
                    onClick={() => setSelectedDate(schedule.dateKey)}
                    className={`
                                    cursor-pointer min-w-[110px] px-4 py-4 rounded-xl border-2 text-center transition-all duration-200 select-none flex flex-col justify-center items-center
                                    ${
                                      selectedDate === schedule.dateKey
                                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md transform -translate-y-1"
                                        : "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-500 hover:-translate-y-1 bg-white"
                                    }
                                `}
                  >
                    <div className="font-bold text-lg md:text-xl">
                      {schedule.displayDate}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[200px]">
                {currentSchedule && currentSchedule.theaters.length > 0 ? (
                  currentSchedule.theaters.map((theater, index) => (
                    <div key={theater.id}>
                      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-12 animate-fade-in">
                        <div className="md:w-1/4 flex flex-col gap-2">
                          <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <EnvironmentOutlined className="text-blue-600" />{" "}
                            {theater.name}
                          </div>
                          <Text className="text-gray-400 text-sm pl-6">
                            {theater.location}
                          </Text>
                        </div>
                        <div className="flex-1">
                          <div className="mb-4"></div>
                          <div className="flex flex-wrap gap-4">
                            {theater.showtimes.map((st) => (
                              <Button
                                key={st.id}
                                size="large"
                                className="h-12 w-28 border-gray-300 font-bold text-gray-700 text-base hover:!border-blue-600 hover:!text-blue-600 hover:!bg-blue-50 rounded-lg shadow-sm transition-all"
                                onClick={() => handleShowtimeClick(st.id)}
                              >
                                {st.time}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      {index < currentSchedule.theaters.length - 1 && (
                        <Divider className="my-0" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-16 text-center flex flex-col items-center justify-center">
                    <Empty description="Không có suất chiếu nào vào ngày này" />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              Hiện chưa có lịch chiếu cho phim này.
            </div>
          )}
        </div>
      </div>

      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        centered
        destroyOnClose={true}
        closeIcon={
          <CloseOutlined
            style={{
              color: "white",
              fontSize: "24px",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: "50%",
              padding: "8px",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        }
        styles={{
          mask: { backgroundColor: "rgba(0, 0, 0, 0.7)" },
        }}
        bodyStyle={{ padding: 0, backgroundColor: "black" }}
      >
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%",
            height: 0,
            overflow: "hidden",
          }}
        >
          <iframe
            title="Movie Trailer"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
            src={getEmbedUrl(movie.trailer)}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>
    </Content>
  );
};

export default MovieDetailPage;
