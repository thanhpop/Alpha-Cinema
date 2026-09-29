import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  List,
  Avatar,
  Popconfirm,
  Tag,
  message,
  Spin,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import moment from "moment";
import axios from "axios";
import { z } from "zod";
import type { Movie, ApiMovie } from "@/types/Movie";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  setMovies,
  addMovie,
  updateMovie,
  removeMovie,
} from "@/features/movies/moviesSlice";
import movieService from "@/services/movieService";

const { Title } = Typography;
const { Option } = Select;

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
  const dispatch = useAppDispatch();
  const movies = useAppSelector((state) => state.movies.items);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState<boolean>(false);
  const [isApiModalVisible, setIsApiModalVisible] = useState<boolean>(false);
  const [apiResults, setApiResults] = useState<ApiMovie[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form] = Form.useForm<any>();
  const [viewForm] = Form.useForm<any>();

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const normalizeGenre = (g?: string) => {
    if (!g || typeof g !== "string") return "";
    return String(g)
      .replace(/^\s*\bphim\b[\s:–—-]*/i, "")
      .trim();
  };

  const filtered = movies.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const items = await movieService.getMovies();
        dispatch(setMovies(items));
      } catch (err: any) {
        console.error("Load movies error", err);
        if (err?.response?.status === 401) {
          message.error("Chưa xác thực (401). Vui lòng đăng nhập.");
        } else {
          message.error("Không thể tải danh sách phim từ server");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dispatch]);

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
        dispatch(updateMovie(updated));
        message.success("Cập nhật phim thành công");
      } else {
        const created = await movieService.createMovie(payload);
        console.log("[MoviePage] create response:", created);
        dispatch(addMovie(created));
        message.success("Thêm phim thành công");
      }
      closeEditModal();
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
      dispatch(removeMovie(id));
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
      render: (_v, _r, index) => (page - 1) * pageSize + (index + 1),
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
              onSearch={(value) => setSearch(value)}
              enterButton
              style={{ width: 400, fontSize: "16px" }}
            />
          </Col>
          <Col flex="auto" />
          <Col style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
            >
              Thêm phim
            </Button>
          </Col>
        </Row>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total: filtered.length,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </Spin>
      </Space>

      {/* Edit / Add Modal */}
      <Modal
        title={editingId ? "Sửa Phim" : "Thêm Phim mới"}
        open={isEditModalVisible}
        onCancel={closeEditModal}
        width={900}
        okText={editingId ? "Lưu" : "Thêm"}
        onOk={handleSave}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const src = form.getFieldValue("poster");
                  return (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "2 / 3",
                        background: "#f5f5f5",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={src}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  );
                }}
              </Form.Item>
              <div style={{ marginTop: 56 }} />
              <Form.Item label="Poster (URL)" name="poster">
                <Input placeholder="URL ảnh poster " />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item>
                <Button type="primary" block onClick={openApiModal}>
                  Tìm phim từ API
                </Button>
              </Form.Item>

              <Form.Item
                label="Tên phim"
                name="title"
                rules={[{ required: true, message: "Vui lòng nhập tên phim" }]}
              >
                <Input placeholder="Nhập tên phim" />
              </Form.Item>
              <Form.Item
                label="Mô tả"
                name="overview"
                rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Thời lượng (phút)"
                    name="duration"
                    rules={[
                      { required: true, message: "Vui lòng nhập thời lượng" },
                    ]}
                  >
                    <InputNumber style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Ngôn ngữ"
                    name="language"
                    rules={[
                      { required: true, message: "Vui lòng nhập ngôn ngữ" },
                    ]}
                  >
                    <Select placeholder="Chọn ngôn ngữ">
                      <Option value="Tiếng Anh">Tiếng Anh</Option>
                      <Option value="Tiếng Việt">Tiếng Việt</Option>
                      <Option value="Tiếng Nhật">Tiếng Nhật</Option>
                      <Option value="Tiếng Hàn">Tiếng Hàn</Option>
                      <Option value="Tiếng Trung">Tiếng Trung</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Thể loại"
                name="genres"
                rules={[{ required: true, message: "Vui lòng nhập thể loại" }]}
              >
                <Select
                  mode="tags"
                  style={{ width: "100%" }}
                  placeholder="Thêm hoặc chọn thể loại"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Ngày khởi chiếu"
                    name="releaseDate"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ngày khởi chiếu",
                      },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Ngày kết thúc" name="endDate">
                    <DatePicker
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      placeholder="Không bắt buộc"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="IMDB ID" name="imdbId">
                    <Input placeholder="Ví dụ: tt15398776" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="TMDB Film ID" name="filmId">
                    <Input placeholder="Ví dụ: 872585" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label="Trailer (YouTube URL)"
                name="trailer"
                rules={[
                  {
                    type: "url",
                    message: "Trailer phải là URL hợp lệ",
                  },
                ]}
              >
                <Input placeholder="https://www.youtube.com/watch?v=..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* View detail Modal */}
      <Modal
        title="Chi tiết Phim"
        open={isViewModalVisible}
        onCancel={closeViewModal}
        width={900}
        footer={[
          <Button key="close" onClick={closeViewModal}>
            Đóng
          </Button>,
        ]}
      >
        <Form form={viewForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item shouldUpdate noStyle>
                {() => {
                  const src = viewForm.getFieldValue("poster");
                  return (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "2 / 3",
                        background: "#f5f5f5",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={src}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  );
                }}
              </Form.Item>
              <div style={{ marginTop: 16 }} />
              <Form.Item label="Poster">
                <Input
                  readOnly
                  value={viewForm.getFieldValue("poster") || ""}
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="Tên phim">
                <Input readOnly value={viewForm.getFieldValue("title") || ""} />
              </Form.Item>

              <Form.Item label="Mô tả">
                <Input.TextArea
                  rows={4}
                  readOnly
                  value={viewForm.getFieldValue("overview") || ""}
                />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Thời lượng (phút)">
                    <Input
                      readOnly
                      value={(() => {
                        const v = viewForm.getFieldValue("duration");
                        return v !== undefined && v !== null ? String(v) : "";
                      })()}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Ngôn ngữ">
                    <Input
                      readOnly
                      value={viewForm.getFieldValue("language") || ""}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Thể loại">
                <div>
                  {Array.isArray(viewForm.getFieldValue("genres")) &&
                    viewForm.getFieldValue("genres").length > 0 &&
                    (viewForm.getFieldValue("genres") as string[]).map((g) => (
                      <Tag key={g}>{g}</Tag>
                    ))}
                </div>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Ngày khởi chiếu">
                    <Input
                      readOnly
                      value={viewForm.getFieldValue("releaseDate") || ""}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Ngày kết thúc">
                    <Input
                      readOnly
                      placeholder="Chưa xác định"
                      value={viewForm.getFieldValue("endDate") || ""}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="IMDB ID">
                    <Input
                      readOnly
                      value={viewForm.getFieldValue("imdbId") || "N/A"}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Film ID">
                    <Input
                      readOnly
                      value={viewForm.getFieldValue("filmId") || "N/A"}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Trailer">
                <Input
                  readOnly
                  value={viewForm.getFieldValue("trailer") || ""}
                />
              </Form.Item>

              {viewForm.getFieldValue("trailer") && (
                <div style={{ marginTop: 12 }}>
                  <iframe
                    width="100%"
                    height="315"
                    src={viewForm
                      .getFieldValue("trailer")
                      .replace("watch?v=", "embed/")}
                    title="Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ borderRadius: 8 }}
                  />
                </div>
              )}
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* API Search Modal */}
      <Modal
        title="Tìm phim từ API"
        open={isApiModalVisible}
        footer={null}
        onCancel={closeApiModal}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input.Search
            placeholder="Nhập tên phim API"
            allowClear
            enterButton="Tìm"
            onSearch={handleApiSearch}
            style={{ width: "100%" }}
          />
          <List
            bordered
            dataSource={apiResults}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleApiSelect(item)}
                style={{ cursor: "pointer" }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar shape="square" size={100} src={item.Poster} />
                  }
                  title={<span style={{ fontWeight: 500 }}>{item.Title}</span>}
                  description={
                    <span style={{ fontSize: 12, color: "#888" }}>
                      {item.Year}
                    </span>
                  }
                />
              </List.Item>
            )}
            style={{ maxHeight: 400, overflowY: "auto" }}
          />
        </Space>
      </Modal>
    </>
  );
};

export default MoviePage;
