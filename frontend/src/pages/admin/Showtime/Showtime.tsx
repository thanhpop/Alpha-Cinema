import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  InputNumber,
  Row,
  Col,
  Typography,
  Popconfirm,
  message,
  DatePicker,
  TimePicker,
  Spin,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { movieService } from "@/services/movieService";
import { theaterService } from "@/services/theaterService";

import { showtimeService, type Showtime } from "@/services/showtimeService";

const { Title } = Typography;

const AdminShowtimeHookPage: React.FC = () => {
  const [items, setItems] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editing, setEditing] = useState<Showtime | null>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [theaters, setTheaters] = useState<any[]>([]);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await showtimeService.getAll();
      setItems(list);
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      try {
        setLoading(true);
        const [list, m, t] = await Promise.all([
          showtimeService.getAll(),
          movieService.getMovies(),
          theaterService.getTheaters(),
        ]);

        if (!mounted) return;
        setItems(list);
        setMovies(m);
        setTheaters(t);
      } catch (err) {
        console.error(err);
        message.error("Lỗi tải dữ liệu");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => {
      return (
        String(s.id).includes(q) ||
        String(s.movieId).includes(q) ||
        String(s.theaterId).includes(q) ||
        s.showDate.toLowerCase().includes(q) ||
        s.showDateIso.toLowerCase().includes(q) ||
        s.showTime.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const openAddModal = () => {
    form.resetFields();
    setEditing(null);
    form.setFieldsValue({ price: 0, totalSeats: 30 });
    setIsEditModalVisible(true);
  };

  const openEditModal = (record: Showtime) => {
    setEditing(record);
    form.setFieldsValue({
      movieId: record.movieId,
      theaterId: record.theaterId,
      showDate: dayjs(record.showDateIso, "YYYY-MM-DD"),
      showTime: dayjs(record.showTime, "HH:mm"),
      price: record.price,
      totalSeats: record.totalSeats,
    });
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    form.resetFields();
    setEditing(null);
    setIsEditModalVisible(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const payloadBase = {
        movieId: Number(values.movieId),
        theaterId: Number(values.theaterId),
        showDate: dayjs(values.showDate).format("YYYY-MM-DD"),
        showTime: dayjs(values.showTime).format("HH:mm"),
        price: Number(values.price),
        totalSeats: Number(values.totalSeats),
      };

      setLoading(true);

      if (editing) {
        const existing = items.find((i) => i.id === editing.id);
        const prevAvailable = existing?.availableSeats ?? 0;

        await showtimeService.update(editing.id!, {
          ...payloadBase,
          availableSeats: Math.min(prevAvailable, payloadBase.totalSeats),
        });

        message.success("Cập nhật thành công");
      } else {
        await showtimeService.create({
          ...payloadBase,
          availableSeats: payloadBase.totalSeats,
        });
        message.success("Tạo lịch chiếu thành công");
      }

      closeEditModal();
      loadData();
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "Lỗi khi lưu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await showtimeService.delete(id);
      message.success("Xóa thành công");
      loadData();
    } catch (err) {
      message.error("Lỗi xóa lịch chiếu");
    }
  };

  const columns: ColumnsType<Showtime> = [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Poster",
      key: "poster",
      dataIndex: "movieId",
      width: 120,
      align: "center",
      render: (movieId: number) => {
        const movie = movies.find((x) => x.id === movieId);
        const src = movie?.poster || "";
        return (
          <img
            src={src}
            alt={movie?.title ?? "poster"}
            style={{
              width: 96,
              height: 144,
              objectFit: "cover",
              borderRadius: 4,
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='84'><rect width='100%' height='100%' fill='%23e6e6e6'/></svg>";
            }}
          />
        );
      },
    },
    {
      title: "Phim",
      dataIndex: "movieId",
      render: (id) => movies.find((m) => m.id === id)?.title || id,
    },
    {
      title: "Rạp",
      dataIndex: "theaterId",
      render: (id) => theaters.find((t) => t.id === id)?.name || id,
    },
    {
      // Backend đã trả về dd/MM/yyyy, chỉ hiển thị.
      title: "Ngày chiếu",
      dataIndex: "showDate",
    },
    { title: "Giờ chiếu", dataIndex: "showTime" },
    {
      title: "Giá",
      dataIndex: "price",
      render: (v) => `${v.toLocaleString("vi-VN")} ₫`,
    },
    {
      title: "Ghế",
      key: "seats",
      render: (_: any, record: Showtime) => {
        const total = Number(record.totalSeats ?? 0);
        const avail = Number(record.availableSeats ?? 0);
        return `${avail} / ${total}`;
      },
      align: "center",
      width: 140,
    },
    {
      title: "Hành động",
      width: 150,
      render: (_, r) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#52c41a" }} />}
            onClick={() => openEditModal(r)}
          />
          <Popconfirm
            title="Xóa lịch chiếu?"
            onConfirm={() => handleDelete(r.id)}
          >
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle" style={{ width: "100%" }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Quản lý lịch chiếu
            </Title>
            <div style={{ marginTop: 8 }}>
              <Input.Search
                placeholder="Tìm kiếm..."
                allowClear
                onSearch={setSearch}
                enterButton
                style={{ width: 360, fontSize: 16 }}
              />
            </div>
          </Col>

          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
            >
              Tạo lịch chiếu
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
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </Spin>
      </Space>

      <Modal
        title={editing ? `Sửa lịch chiếu ` : "Tạo mới"}
        open={isEditModalVisible}
        onCancel={closeEditModal}
        onOk={handleSave}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="movieId" label="Phim" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn phim"
              optionLabelProp="label"
              showSearch
              filterOption={(input, option) => {
                const title = option?.label?.toString().toLowerCase() ?? "";
                return title.includes(input.toLowerCase());
              }}
            >
              {movies.map((m) => (
                <Select.Option key={m.id} value={m.id} label={m.title}>
                  <Space>
                    <img
                      src={m.poster || m.image || ""}
                      alt={m.title}
                      style={{
                        width: 75,
                        height: 100,
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='56'><rect width='100%' height='100%' fill='%23e6e6e6'/></svg>";
                      }}
                    />
                    <span>{m.title}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="theaterId" label="Rạp" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn rạp"
              optionLabelProp="label"
              showSearch
              filterOption={(input, option) => {
                const lab = option?.label?.toString().toLowerCase() ?? "";
                return lab.includes(input.toLowerCase());
              }}
            >
              {theaters.map((t) => (
                <Select.Option
                  key={t.id}
                  value={t.id}
                  label={`${t.name} — ${t.location ?? ""}`}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 600 }}>{t.name}</span>
                    <span style={{ color: "#888", fontSize: 12 }}>
                      {t.location}
                    </span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="showDate"
                label="Ngày chiếu"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="showTime"
                label="Giờ chiếu"
                rules={[{ required: true }]}
              >
                <TimePicker format="HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="price"
            label="Giá (VNĐ)"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>

          <Form.Item
            name="totalSeats"
            label="Tổng ghế"
            rules={[{ required: true, message: "Nhập tổng ghế" }]}
          >
            <Select<number> placeholder="Chọn tổng ghế" disabled={!!editing}>
              <Select.Option value={30}>30</Select.Option>
              <Select.Option value={40}>40</Select.Option>
              <Select.Option value={50}>50</Select.Option>
              <Select.Option value={60}>60</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AdminShowtimeHookPage;
