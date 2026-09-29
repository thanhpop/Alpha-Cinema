import React, { useEffect, useState, useMemo } from "react";
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
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { Theater } from "@/types/Theater";
import theaterService from "@/services/theaterService";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  setTheaters,
  addTheater,
  updateTheater as updateTheaterAction,
  removeTheater,
} from "@/features/theater/theaterSlice";

const { Title } = Typography;

const AdminTheaterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const theaters = useAppSelector((s) => s.theaters.items);

  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState<boolean>(false);
  const [editing, setEditing] = useState<Theater | null>(null);

  const [form] = Form.useForm<Theater>();
  const [viewForm] = Form.useForm<Theater>();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await theaterService.getTheaters();
        dispatch(setTheaters(list));
      } catch (err: any) {
        console.error("Load theaters error", err);
        if (err?.response?.status === 401) {
          message.error("Chưa xác thực (401). Vui lòng đăng nhập.");
        } else {
          message.error("Không thể tải danh sách rạp từ server");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return theaters;
    return theaters.filter(
      (t) =>
        (t.name ?? "").toLowerCase().includes(q) ||
        (t.location ?? "").toLowerCase().includes(q) ||
        String(t.id ?? "").includes(q),
    );
  }, [theaters, search]);

  const openAddModal = () => {
    form.resetFields();
    setEditing(null);
    setIsEditModalVisible(true);
  };

  const openEditModal = (record: Theater) => {
    form.setFieldsValue({
      id: record.id,
      name: record.name,
      location: record.location,
      capacity: record.capacity,
    });
    setEditing(record);
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    form.resetFields();
    setEditing(null);
    setIsEditModalVisible(false);
  };

  const openViewModal = (record: Theater) => {
    viewForm.setFieldsValue(record);
    setIsViewModalVisible(true);
  };

  const closeViewModal = () => {
    viewForm.resetFields();
    setIsViewModalVisible(false);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload: Omit<Theater, "id"> = {
        name: values.name,
        location: values.location,
        capacity: Number(values.capacity ?? 0),
      };

      if (editing && editing.id) {
        const updated = await theaterService.updateTheater(
          Number(editing.id),
          payload,
        );
        dispatch(updateTheaterAction(updated));
        message.success("Cập nhật rạp thành công");
      } else {
        const created = await theaterService.createTheater(payload);
        dispatch(addTheater(created));
        message.success("Tạo rạp thành công");
      }
      closeEditModal();
    } catch (err: any) {
      console.error("Save theater error", err);
      if (err?.response?.data?.message)
        message.error(err.response.data.message);
      else if (err?.message) message.error(err.message);
      else message.error("Lỗi khi lưu rạp");
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await theaterService.deleteTheater(id);
      dispatch(removeTheater(id));
      message.success("Xóa rạp thành công");
    } catch (err: any) {
      console.error("Delete theater error", err);
      if (err?.response?.status === 401) message.error("Không có quyền (401)");
      else message.error("Xóa rạp thất bại");
    }
  };

  const columns: ColumnsType<Theater> = [
    { title: "ID", dataIndex: "id", key: "id", width: 100 },
    { title: "Tên rạp", dataIndex: "name", key: "name" },
    { title: "Địa điểm", dataIndex: "location", key: "location" },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      key: "capacity",
      width: 140,
    },
    {
      title: "Hành động",
      key: "action",
      width: 180,
      render: (_text, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "#1890ff", fontSize: 18 }} />}
            onClick={() => openViewModal(record)}
          />
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#52c41a", fontSize: 18 }} />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title={`Xóa rạp "${record.name}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button
              type="text"
              icon={
                <DeleteOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
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
        <Title level={3}>Quản lý Rạp</Title>

        <Row style={{ width: "100%" }} align="middle" gutter={12}>
          <Col>
            <Input.Search
              placeholder="Tìm kiếm theo tên, địa điểm"
              allowClear
              onSearch={(v) => setSearch(v)}
              enterButton
              style={{ width: 360, fontSize: 16 }}
            />
          </Col>
          <Col flex="auto" />
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
            >
              Tạo rạp
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

      <Modal
        title={editing ? "Sửa Rạp" : "Tạo Rạp mới"}
        open={isEditModalVisible}
        onCancel={closeEditModal}
        width={700}
        okText={editing ? "Lưu" : "Tạo"}
        onOk={handleSave}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ capacity: 0 }}>
          <Form.Item
            name="name"
            label="Tên rạp"
            rules={[{ required: true, message: "Vui lòng nhập tên rạp" }]}
          >
            <Input placeholder="" />
          </Form.Item>

          <Form.Item
            name="location"
            label="Địa điểm"
            rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
          >
            <Input placeholder="" />
          </Form.Item>

          <Form.Item
            name="capacity"
            label="Sức chứa"
            rules={[{ required: true, message: "Vui lòng nhập sức chứa" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết Rạp"
        open={isViewModalVisible}
        onCancel={closeViewModal}
        footer={[
          <Button key="close" onClick={closeViewModal}>
            Đóng
          </Button>,
        ]}
      >
        <Form form={viewForm} layout="vertical">
          <Form.Item label="ID">
            <Input
              readOnly
              value={String(viewForm.getFieldValue("id") ?? "")}
            />
          </Form.Item>
          <Form.Item label="Tên rạp">
            <Input readOnly value={viewForm.getFieldValue("name") ?? ""} />
          </Form.Item>
          <Form.Item label="Địa điểm">
            <Input readOnly value={viewForm.getFieldValue("location") ?? ""} />
          </Form.Item>
          <Form.Item label="Sức chứa">
            <Input
              readOnly
              value={String(viewForm.getFieldValue("capacity") ?? "")}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AdminTheaterPage;
