import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Layout,
  Button,
  Tag,
  Row,
  Col,
  Typography,
  Spin,
  Empty,
  Modal,
} from "antd";
import {
  PlayCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import movieService from "@/services/movieService";
import type { Movie } from "@/types/Movie";
import ShowtimeSchedule from "@/components/ShowtimeSchedule";
import AgeRatingBadge from "@/components/AgeRatingBadge";
import { AGE_RATING_INFO } from "@/utils/ageRating";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const MovieDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        setMovie(await movieService.getMovieById(Number(id)));
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
                  <AgeRatingBadge
                    rating={movie.ageRating}
                    className="!text-base !px-2"
                  />
                  <span>
                    <ClockCircleOutlined className="mr-2" />
                    {movie.duration} phút
                  </span>
                  <span>
                    <CalendarOutlined className="mr-2" />
                    Khởi chiếu: {movie.releaseDate}
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
                {movie.ageRating && (
                  <p className="mt-3 text-gray-600">
                    <span className="font-bold text-gray-900">
                      Phân loại:
                    </span>{" "}
                    {movie.ageRating} –{" "}
                    {AGE_RATING_INFO[movie.ageRating].description}
                  </p>
                )}
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

          <ShowtimeSchedule movieId={movie.id} />
        </div>
      </div>

      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        centered
        destroyOnHidden
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
          body: { padding: 0, backgroundColor: "black" },
        }}
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
