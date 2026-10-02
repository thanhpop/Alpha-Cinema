import React, { useState, useEffect } from "react";
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
  message,
  Spin,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import AddButton from "@/components/AddButton";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { movieService } from "@/services/movieService";
import { theaterService } from "@/services/theaterService";

import { showtimeService, type Showtime } from "@/services/showtimeService";
import { usePagedList } from "@/hooks/usePagedList";
import ShowtimeFormModal from "@/pages/admin/Showtime/components/ShowtimeFormModal";

const { Title } = Typography;

const AdminShowtimeHookPage: React.FC = () => {
  const { items, loading, setFilters, reload, pagination } = usePagedList(
    showtimeService.getPaged,
    {
      initialFilters: { search: "" },
      onError: (err) => {
        console.error(err);
        message.error("Lỗi tải dữ liệu");
      },
    },
  );
  const [saving, setSaving] = useState(false);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editing, setEditing] = useState<Showtime | null>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [theaters, setTheaters] = useState<any[]>([]);
  const [form] = Form.useForm();

  // Danh sách đầy đủ phim / rạp cho dropdown và hiển thị tên, poster
  useEffect(() => {
    let mounted = true;

    Promise.all([movieService.getMovies(), theaterService.getTheaters()])
      .then(([m, t]) => {
        if (!mounted) return;
        setMovies(m);
        setTheaters(t);
      })
      .catch((err) => {
        console.error(err);
        message.error("Lỗi tải danh sách phim / rạp");
      });

    return () => {
      mounted = false;
    };
  }, []);

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

      setSaving(true);

      if (editing) {
        const prevAvailable = editing.availableSeats ?? 0;

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
      reload();
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await showtimeService.delete(id);
      message.success("Xóa thành công");
      reload();
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
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <Title level={3}>Quản lý lịch chiếu</Title>

        <Row style={{ width: "100%" }} align="middle" gutter={12}>
          <Col>
            <Input.Search
              placeholder="Tên phim, rạp hoặc ngày (dd/MM/yyyy)"
              allowClear
              onSearch={(v) => setFilters({ search: v })}
              enterButton
              style={{ width: 360, fontSize: 16 }}
            />
          </Col>
          <Col flex="auto" />
          <Col>
            <AddButton onClick={openAddModal}>Tạo lịch chiếu</AddButton>
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            pagination={pagination}
          />
        </Spin>
      </Space>

      <ShowtimeFormModal
        open={isEditModalVisible}
        isEditing={!!editing}
        saving={saving}
        form={form}
        movies={movies}
        theaters={theaters}
        onOk={handleSave}
        onCancel={closeEditModal}
      />
    </>
  );
};

export default AdminShowtimeHookPage;
