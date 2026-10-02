import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Form,
  Row,
  Col,
  Typography,
  Popconfirm,
  Tag,
  message,
  Spin,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import AddButton from "@/components/AddButton";
import type { ColumnsType } from "antd/es/table";
import moment from "moment";
import axios from "axios";
import { z } from "zod";
import type { Movie, ApiMovie } from "@/types/Movie";

import { usePagedList } from "@/hooks/usePagedList";
import movieService from "@/services/movieService";
import MovieFormModal from "@/pages/admin/Movie/components/MovieFormModal";
import MovieViewModal from "@/pages/admin/Movie/components/MovieViewModal";
import MovieApiSearchModal from "@/pages/admin/Movie/components/MovieApiSearchModal";

const { Title } = Typography;

const apiKey = import.meta.env.VITE_TMDB_API_KEY;

const apiUrl = import.meta.env.VITE_TMDB_API_URL;
const imageUrl = import.meta.env.VITE_TMDB_IMAGE_URL;

const MovieSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Tên phim không được để trống"),
  overview: z.string().min(1, "Mô tả không được để trống"),
  genres: z.array(z.string()).min(1, "Phải chọn ít nhất một thể loại"),
  duration: z.number().positive("Thời lượng phải lớn hơn 0"),
  language: z.string().min(1, "Ngôn ngữ không được để trống"),
  releaseDate: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "releaseDate phải là chuỗi ISO hợp lệ",
  }),
  endDate: z.string().nullable().optional(),
  poster: z.url("Poster phải là URL hợp lệ").optional(),
  trailer: z.url("Trailer phải là URL hợp lệ").optional(),
  imdbId: z.string().optional(),
  filmId: z.string().optional(),
});

const MoviePage: React.FC = () => {
  const {
    items: movies,
    loading,
    setFilters,
    reload,
    pagination,
    rowNumber,
  } = usePagedList(movieService.getPaged, {
    initialFilters: { search: "" },
    onError: (err: any) => {
      console.error("Load movies error", err);
      if (err?.response?.status === 401) {
        message.error("Chưa xác thực (401). Vui lòng đăng nhập.");
      } else {
        message.error("Không thể tải danh sách phim từ server");
      }
    },
  });
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState<boolean>(false);
  const [isApiModalVisible, setIsApiModalVisible] = useState<boolean>(false);
  const [apiResults, setApiResults] = useState<ApiMovie[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form] = Form.useForm<any>();
  const [viewForm] = Form.useForm<any>();

  const normalizeGenre = (g?: string) => {
    if (!g || typeof g !== "string") return "";
    return String(g)
      .replace(/^\s*\bphim\b[\s:–—-]*/i, "")
      .trim();
  };

  const openAddModal = () => {
    form.resetFields();
    setEditingId(null);
    setIsEditModalVisible(true);
  };

  const openEditModal = (record: Movie) => {
    form.setFieldsValue({
      title: record.title,
      overview: record.overview,
      genres: record.genres,
      duration: record.duration,
      language: record.language,
      releaseDate: record.releaseDateIso
        ? moment(record.releaseDateIso, "YYYY-MM-DD")
        : undefined,
      endDate: record.endDateIso
        ? moment(record.endDateIso, "YYYY-MM-DD")
        : undefined,
      poster: record.poster,
      trailer: record.trailer ?? undefined,
      imdbId: record.imdbId ?? undefined,
      filmId: record.filmId ?? undefined,
    });
    setEditingId(record.id);
    setIsEditModalVisible(true);
  };

  const openViewModal = (record: Movie) => {
    viewForm.setFieldsValue({
      title: record.title,
      overview: record.overview,
      genres: record.genres,
      duration: record.duration,
      language: record.language,
      releaseDate: record.releaseDate ?? "",
      endDate: record.endDate ?? "",
      poster: record.poster,
      trailer: record.trailer ?? undefined,
      imdbId: record.imdbId ?? undefined,
      filmId: record.filmId ?? undefined,
    });
    setIsViewModalVisible(true);
  };

  const closeEditModal = () => {
    form.resetFields();
    setEditingId(null);
    setIsEditModalVisible(false);
  };

  const closeViewModal = () => {
    viewForm.resetFields();
    setIsViewModalVisible(false);
  };

  const openApiModal = () => {
    setApiResults([]);
    setIsApiModalVisible(true);
  };

  const closeApiModal = () => setIsApiModalVisible(false);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // Gửi lên yyyy-MM-dd, backend tự chuẩn hoá và trả về dd/MM/yyyy.
      const releaseIso = values.releaseDate.format("YYYY-MM-DD");

      const end = values.endDate;
      const endIso = end ? end.format("YYYY-MM-DD") : null;

      const sanitizedGenres: string[] = (values.genres || []).map((g: any) =>
        normalizeGenre(String(g)),
      );

      const payload: Omit<Movie, "id"> = {
        title: values.title,
        overview: values.overview,
        genres: sanitizedGenres,
        duration: values.duration,
        language: values.language,
        releaseDate: releaseIso,
        endDate: endIso,
        poster: values.poster || undefined,
        trailer: values.trailer || undefined,
        imdbId: values.imdbId || undefined,
        filmId: values.filmId || undefined,
      };

      const idNum = editingId ?? Date.now();
      const candidate = { id: Number(idNum), ...payload };
      const parsed = MovieSchema.safeParse(candidate);
      if (!parsed.success) {
        message.error(parsed.error.issues.map((i) => i.message).join(", "));
        return;
      }

      if (editingId) {
        const updated = await movieService.updateMovie(editingId, payload);
        console.log("updated from API:", updated);
        message.success("Cập nhật phim thành công");
      } else {
        const created = await movieService.createMovie(payload);
        console.log("[MoviePage] create response:", created);
        message.success("Thêm phim thành công");
      }
      closeEditModal();
      reload();
    } catch (err: any) {
      console.error(err);
      if (err?.response?.data?.message)
        message.error(err.response.data.message);
      else if (err?.message) message.error(err.message);
      else message.error("Lỗi khi lưu phim");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await movieService.deleteMovie(id);
      reload();
      message.success("Xóa phim thành công");
    } catch (err: any) {
      console.error("Delete error", err);
      if (err?.response?.status === 401) message.error("Không có quyền (401)");
      else message.error("Xóa phim thất bại");
    }
  };

  const handleApiSearch = async (value: string) => {
    if (!value) return setApiResults([]);
    try {
      const endpoint = `${apiUrl}/search/movie?query=${encodeURIComponent(
        value,
      )}&language=vi-VN&page=1`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const json = res.data;
      const results = (json.results || []).map((m: any) => ({
        id: m.id,
        Title: m.title,
        Year: m.release_date ? m.release_date.slice(0, 4) : "",
        imdbID: m.imdb_id,
        Poster: m.poster_path ? `${imageUrl}${m.poster_path}` : undefined,
      }));
      setApiResults(results);
    } catch (e) {
      console.error("TMDB search error", e);
      setApiResults([]);
    }
  };
  const fetchTrailerFromTmdb = async (
    movieId: number,
  ): Promise<string | undefined> => {
    try {
      const res = await axios.get(`${apiUrl}/movie/${movieId}/videos`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const videos = res.data?.results || [];

      // Ưu tiên: Official YouTube Trailer
      const trailer =
        videos.find(
          (v: any) =>
            v.site === "YouTube" && v.type === "Trailer" && v.official === true,
        ) ||
        videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer");

      if (!trailer?.key) return undefined;

      return `https://www.youtube.com/watch?v=${trailer.key}`;
    } catch (e) {
      console.error("Fetch trailer error", e);
      return undefined;
    }
  };

  const handleApiSelect = async (item: ApiMovie) => {
    try {
      const detailsRes = await axios.get(
        `${apiUrl}/movie/${item.id}?language=vi-VN`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      );
      const trailerUrl = await fetchTrailerFromTmdb(item.id);
      const details = detailsRes.data;

      const runtime: number | undefined = details.runtime;
      const originalLang: string =
        details.original_language || details.originalLanguage || "";
      const releaseDateStr: string = details.release_date || "";
      const posterUrl = details.poster_path
        ? `${imageUrl}${details.poster_path}`
        : item.Poster;

      let langLabel = originalLang;
      if (originalLang === "en") langLabel = "Tiếng Anh";
      else if (originalLang === "vi") langLabel = "Tiếng Việt";
      else if (originalLang === "ja") langLabel = "Tiếng Nhật";
      else if (originalLang === "ko") langLabel = "Tiếng Hàn";
      else if (originalLang === "zh") langLabel = "Tiếng Trung";

      const genreNames: string[] = (details.genres || [])
        .map((g: any) => normalizeGenre(g.name))
        .slice(0, 3);
      const imdbFromTmdb = details.imdb_id ?? undefined;
      const filmIdFromTmdb = details.id ? String(details.id) : undefined;
      form.setFieldsValue({
        title: item.Title,
        overview: details.overview
          ? details.overview
          : `${item.Title} (${item.Year})`,
        genres: genreNames,
        poster: posterUrl,
        duration: runtime,
        language: langLabel,
        releaseDate: releaseDateStr
          ? moment(releaseDateStr, "YYYY-MM-DD")
          : undefined,
        endDate: undefined,
        imdbId: imdbFromTmdb,
        filmId: filmIdFromTmdb,
        trailer: trailerUrl,
      });
    } catch (e) {
      console.error("Movie details fetch error", e);
      form.setFieldsValue({
        title: item.Title,
        overview: `${item.Title} (${item.Year})`,
        genres: [],
        poster: item.Poster,
      });
    } finally {
      closeApiModal();
      if (!isEditModalVisible) {
        setEditingId(null);
        setIsEditModalVisible(true);
      }
    }
  };

  const columns: ColumnsType<Movie> = [
    {
      title: "STT",
      key: "index",
      width: 80,
      render: (_v, _r, index) => rowNumber(index),
    },
    {
      title: "Poster",
      dataIndex: "poster",
      key: "poster",
      width: 120,
      render: (poster: string | undefined) => (
        <img
          src={poster}
          alt="poster"
          style={{
            width: 96,
            height: 144,
            objectFit: "cover",
            borderRadius: 4,
          }}
        />
      ),
    },
    { title: "Tên phim", dataIndex: "title", key: "title" },
    {
      title: "Thể loại",
      dataIndex: "genres",
      key: "genres",
      render: (genres: string[]) => (
        <>
          {Array.isArray(genres) &&
            genres.map((tag) => <Tag key={tag}>{tag}</Tag>)}
        </>
      ),
    },
    { title: "Thời lượng (phút)", dataIndex: "duration", key: "duration" },
    { title: "Ngôn ngữ", dataIndex: "language", key: "language" },
    { title: "Ngày khởi chiếu", dataIndex: "releaseDate", key: "releaseDate" },
    {
      title: "Kết thúc",
      dataIndex: "endDate",
      key: "endDate",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_text, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "#1890ff", fontSize: 20 }} />}
            onClick={() => openViewModal(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#52c41a", fontSize: 20 }} />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title={`Xóa phim "${record.title}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              icon={
                <DeleteOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
              }
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Title level={3}>Quản lý Phim</Title>
        <Row style={{ width: "100%" }} align="middle" gutter={12}>
          <Col>
            <Input.Search
              placeholder="Tìm kiếm phim"
              allowClear
              onSearch={(value) => setFilters({ search: value })}
              enterButton
              style={{ width: 400, fontSize: "16px" }}
            />
          </Col>
          <Col flex="auto" />
          <Col>
            <AddButton onClick={openAddModal}>Thêm phim</AddButton>
          </Col>
        </Row>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={movies}
            rowKey="id"
            pagination={pagination}
          />
        </Spin>
      </Space>

      <MovieFormModal
        open={isEditModalVisible}
        isEditing={!!editingId}
        form={form}
        onOk={handleSave}
        onCancel={closeEditModal}
        onOpenApiSearch={openApiModal}
      />

      <MovieViewModal
        open={isViewModalVisible}
        viewForm={viewForm}
        onClose={closeViewModal}
      />

      <MovieApiSearchModal
        open={isApiModalVisible}
        results={apiResults}
        onSearch={handleApiSearch}
        onSelect={handleApiSelect}
        onClose={closeApiModal}
      />
    </>
  );
};

export default MoviePage;
