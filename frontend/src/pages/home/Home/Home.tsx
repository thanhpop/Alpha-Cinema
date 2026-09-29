import React, { useState } from "react";
import { Layout, Button, Carousel, Tabs, Card, Modal } from "antd";
import { PlayCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import type { TabsProps } from "antd";
import { useNavigate } from "react-router-dom";

import { useEffect } from "react";
import { showtimeService } from "@/services/showtimeService";
import movieService from "@/services/movieService";
import type { Banner } from "@/types/Banner";
import { bannerService } from "@/services/bannerService";

const { Content } = Layout;
const { Meta } = Card;

interface HomeMovie {
  id: number;
  title: string;
  image: string;
  genre: string;
  duration: string;
  trailer?: string;
}

const MovieCard: React.FC<{ movie: HomeMovie; isComingSoon?: boolean }> = ({
  movie,
  isComingSoon,
}) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleDetailClick = () => {
    navigate(`/movie/${movie.id}`);
  };
  const getEmbedUrl = (url?: string) => {
    if (!url) return "";
    const videoId = url.includes("youtube.com")
      ? new URL(url).searchParams.get("v")
      : url.split("/").pop();

    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
  };

  return (
    <Card
      hoverable
      className="w-full shadow-lg rounded-lg overflow-hidden transition-transform duration-300 hover:-translate-y-2 bg-white border border-gray-100"
      bodyStyle={{ padding: "12px" }}
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

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex flex-col items-center justify-center gap-3 transition-all duration-300">
            <Button
              type="primary"
              shape="round"
              icon={<PlayCircleOutlined />}
              className="opacity-0 group-hover:opacity-100 bg-blue-600 border-blue-600 hover:!bg-blue-500 hover:!border-blue-500 font-bold shadow-lg min-w-[140px] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
            >
              {isComingSoon ? "Xem Trailer" : "Mua Vé"}
            </Button>

            {!isComingSoon && (
              <Button
                shape="round"
                icon={<InfoCircleOutlined />}
                onClick={handleDetailClick}
                className="opacity-0 group-hover:opacity-100 bg-transparent text-white border-2 border-white hover:!bg-white hover:!text-black hover:!border-white font-bold shadow-lg min-w-[140px] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75"
              >
                Chi Tiết
              </Button>
            )}
          </div>
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
        destroyOnClose
        bodyStyle={{ padding: 0, backgroundColor: "black" }}
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
    </Card>
  );
};

const HomePage: React.FC = () => {
  const [nowShowing, setNowShowing] = useState<HomeMovie[]>([]);
  const [comingSoonMovies, setComingSoonMovies] = useState<HomeMovie[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const loadNowShowing = async () => {
      try {
        const showtimes = await showtimeService.getAvailable();

        const movieIdSet = new Set(showtimes.map((s) => s.movieId));

        if (movieIdSet.size === 0) {
          setNowShowing([]);
          return;
        }

        const allMovies = await movieService.getMovies();

        const showingMovies = allMovies.filter((m) => movieIdSet.has(m.id));

        const mapped: HomeMovie[] = showingMovies.map((m) => ({
          id: m.id,
          title: m.title,
          image: m.poster || "https://placehold.co/400x600?text=No+Image",
          genre: m.genres?.join(", ") || "N/A",
          duration: m.duration ? `${m.duration} phút` : "N/A",
          trailer: m.trailer,
        }));

        setNowShowing(mapped);
      } catch (err) {
        console.error("Load now showing failed", err);
        setNowShowing([]);
      } finally {
      }
    };

    loadNowShowing();
  }, []);

  useEffect(() => {
    const loadComingSoon = async () => {
      try {
        const upcomingShowtimes = await showtimeService.getUpcoming();

        const movieIdSet = new Set(upcomingShowtimes.map((s) => s.movieId));

        if (movieIdSet.size === 0) {
          setComingSoonMovies([]);
          return;
        }

        const allMovies = await movieService.getMovies();

        const comingMovies = allMovies.filter((m) => movieIdSet.has(m.id));

        const mapped: HomeMovie[] = comingMovies.map((m) => ({
          id: m.id,
          title: m.title,
          image: m.poster || "https://placehold.co/400x600?text=No+Image",
          genre: m.genres?.join(", ") || "N/A",
          duration: m.duration ? `${m.duration} phút` : "N/A",
        }));

        setComingSoonMovies(mapped);
      } catch (err) {
        console.error("Load coming soon failed", err);
        setComingSoonMovies([]);
      }
    };

    loadComingSoon();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 py-4">
          {nowShowing.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ),
    },
    {
      key: "2",
      label: <span className="text-lg font-bold px-6">PHIM SẮP CHIẾU</span>,
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 py-4">
          {comingSoonMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} isComingSoon />
          ))}
        </div>
      ),
    },
  ];

  return (
    <Content>
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
