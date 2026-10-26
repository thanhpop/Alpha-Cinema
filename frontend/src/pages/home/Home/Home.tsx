import React, { useState } from "react";
import {
  Layout,
  Button,
  Carousel,
  Tabs,
  Card,
  Modal,
  Spin,
} from "antd";
import { PlayCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import type { TabsProps } from "antd";
import { useNavigate } from "react-router-dom";

import { useEffect } from "react";
import movieService from "@/services/movieService";
import type { Banner } from "@/types/Banner";
import type { AgeRating, ShowingMovie } from "@/types/Movie";
import { bannerService } from "@/services/bannerService";
import ShowtimeSchedule from "@/components/ShowtimeSchedule";
import AgeRatingBadge from "@/components/AgeRatingBadge";

const { Content } = Layout;
const { Meta } = Card;

interface HomeMovie {
  id: number;
  title: string;
  image: string;
  genre: string;
  duration: string;
  trailer?: string;
  releaseDate?: string;
  ageRating?: AgeRating;
  hasShowtimes: boolean;
}

const toHomeMovie = (m: ShowingMovie): HomeMovie => ({
  id: m.id,
  title: m.title,
  image: m.poster || "https://placehold.co/400x600?text=No+Image",
  genre: m.genres?.join(", ") || "N/A",
  duration: m.duration ? `${m.duration} phút` : "N/A",
  trailer: m.trailer,
  releaseDate: m.releaseDate,
  ageRating: m.ageRating,
  hasShowtimes: m.hasShowtimes,
});

const getEmbedUrl = (url?: string) => {
  if (!url) return "";
  const match = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  );
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
  }
  return url;
};

const MovieCard: React.FC<{ movie: HomeMovie; isComingSoon?: boolean }> = ({
  movie,
  isComingSoon,
}) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const handleDetailClick = () => {
    navigate(`/movie/${movie.id}`);
  };

  const primaryAction = movie.hasShowtimes
    ? { label: "Mua Vé", onClick: () => setIsScheduleOpen(true) }
    : movie.trailer
      ? { label: "Xem Trailer", onClick: () => setIsModalOpen(true) }
      : null;

  return (
    <Card
      hoverable
      className="w-full shadow-lg rounded-lg overflow-hidden transition-transform duration-300 hover:-translate-y-2 bg-white border border-gray-100"
      styles={{ body: { padding: "12px" } }}
      cover={
        <div className="relative group h-[350px] overflow-hidden">
          <img
            alt={movie.title}
            src={movie.image}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.currentTarget.src =
                "https://placehold.co/400x600?text=No+Image";
            }}
          />

          {isComingSoon && movie.hasShowtimes && (
            <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
              CHIẾU SỚM
            </span>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex flex-col items-center justify-center gap-3 transition-all duration-300">
            {primaryAction && (
              <Button
                type="primary"
                shape="round"
                icon={<PlayCircleOutlined />}
                onClick={primaryAction.onClick}
                className="opacity-0 group-hover:opacity-100 bg-blue-600 border-blue-600 hover:!bg-blue-500 hover:!border-blue-500 font-bold shadow-lg min-w-[140px] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
              >
                {primaryAction.label}
              </Button>
            )}

            <Button
              shape="round"
              icon={<InfoCircleOutlined />}
              onClick={handleDetailClick}
              className="opacity-0 group-hover:opacity-100 bg-transparent text-white border-2 border-white hover:!bg-white hover:!text-black hover:!border-white font-bold shadow-lg min-w-[140px] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75"
            >
              Chi Tiết
            </Button>
          </div>

          <AgeRatingBadge
            rating={movie.ageRating}
            className="absolute top-3 right-3 shadow"
          />
        </div>
      }
    >
      <Meta
        title={
          <span className="text-lg font-bold text-gray-800 truncate block">
            {movie.title}
          </span>
        }
        description={
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center text-xs text-gray-500 gap-2">
              <span className="truncate flex-1">{movie.genre}</span>

              <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium whitespace-nowrap">
                {movie.duration}
              </span>
            </div>
            {isComingSoon && movie.releaseDate && (
              <span className="text-xs text-gray-500">
                Khởi chiếu:{" "}
                <span className="font-semibold text-gray-700">
                  {movie.releaseDate}
                </span>
              </span>
            )}
          </div>
        }
      />
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        centered
        destroyOnHidden
        styles={{ body: { padding: 0, backgroundColor: "black" } }}
      >
        <div
          style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}
        >
          <iframe
            title="Movie Trailer"
            src={getEmbedUrl(movie.trailer)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </Modal>
      <Modal
        title={
          <span className="text-xl font-bold uppercase">
            Lịch chiếu - {movie.title}
          </span>
        }
        open={isScheduleOpen}
        onCancel={() => setIsScheduleOpen(false)}
        footer={null}
        width={960}
        centered
        destroyOnHidden
      >
        <ShowtimeSchedule movieId={movie.id} />
      </Modal>
    </Card>
  );
};

const MovieGrid: React.FC<{
  movies: HomeMovie[];
  loading: boolean;
  error: boolean;
  emptyText: string;
  isComingSoon?: boolean;
}> = ({ movies, loading, error, emptyText, isComingSoon }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spin size="large" />
      </div>
    );
  }

  if (error || movies.length === 0) {
    return (
      <p className="py-16 text-center text-gray-500">
        {error ? "Không tải được danh sách phim, vui lòng thử lại sau" : emptyText}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 py-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} isComingSoon={isComingSoon} />
      ))}
    </div>
  );
};

const HomePage: React.FC = () => {
  const [nowShowing, setNowShowing] = useState<HomeMovie[]>([]);
  const [comingSoonMovies, setComingSoonMovies] = useState<HomeMovie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const [nowShowingData, comingSoonData] = await Promise.all([
          movieService.getNowShowing(),
          movieService.getComingSoon(),
        ]);

        setNowShowing(nowShowingData.map(toHomeMovie));
        setComingSoonMovies(comingSoonData.map(toHomeMovie));
      } catch (err) {
        console.error("Load movies failed", err);
        setMoviesError(true);
      } finally {
        setMoviesLoading(false);
      }
    };

    loadMovies();
  }, []);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await bannerService.getActive();

        const activeBanners = res.data.data
          .filter((b) => b.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        setBanners(activeBanners);
      } catch (err) {
        console.error("Load banner failed", err);
        setBanners([]);
      }
    };

    loadBanners();
  }, []);

  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: <span className="text-lg font-bold px-6">PHIM ĐANG CHIẾU</span>,
      children: (
        <MovieGrid
          movies={nowShowing}
          loading={moviesLoading}
          error={moviesError}
          emptyText="Hiện chưa có phim đang chiếu"
        />
      ),
    },
    {
      key: "2",
      label: <span className="text-lg font-bold px-6">PHIM SẮP CHIẾU</span>,
      children: (
        <MovieGrid
          movies={comingSoonMovies}
          loading={moviesLoading}
          error={moviesError}
          emptyText="Chưa có phim sắp chiếu"
          isComingSoon
        />
      ),
    },
  ];

  return (
    <Content>
      {banners.length > 0 && (
        <div className="relative">
          <Carousel autoplay effect="fade" autoplaySpeed={5000}>
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="h-[400px] md:h-[550px] w-full relative"
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </Carousel>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mt-4">
          <Tabs
            defaultActiveKey="1"
            items={tabItems}
            centered
            size="large"
            tabBarStyle={{
              marginBottom: 32,
              fontWeight: "bold",
              color: "#1677ff",
            }}
            className="custom-tabs"
          />
        </div>
      </div>
    </Content>
  );
};

export default HomePage;
