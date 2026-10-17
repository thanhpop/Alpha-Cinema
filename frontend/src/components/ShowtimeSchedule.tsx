import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Divider, Empty, Spin, Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

import { showtimeService } from "@/services/showtimeService";
import type { Showtime } from "@/types/Showtime";

import theaterService from "@/services/theaterService";
import type { Theater } from "@/types/Theater";

const { Text } = Typography;

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

const ShowtimeSchedule: React.FC<{ movieId: number }> = ({ movieId }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<UISchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [showtimesData, theatersData] = await Promise.all([
          showtimeService.getByMovie(movieId),
          theaterService.getTheaters(),
        ]);

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

        setSchedules(
          processShowtimesToSchedule(filteredShowtimes, theaterMapData),
        );
        setSelectedDate(generateNext7Days()[0]);
      } catch (err) {
        console.error("Failed to load showtimes", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

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
    } catch {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const currentSchedule = schedules.find((s) => s.dateKey === selectedDate);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );

  if (schedules.length === 0)
    return (
      <div className="p-16 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        Hiện chưa có lịch chiếu cho phim này.
      </div>
    );

  return (
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
  );
};

export default ShowtimeSchedule;
