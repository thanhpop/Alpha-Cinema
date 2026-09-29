import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  message,
  Popconfirm,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

import type { ColumnsType } from "antd/es/table";
import type { Banner } from "@/types/Banner";
import { bannerService } from "@/services/bannerService";
import { Typography, Row, Col, Select, Tag } from "antd";

export default function BannerPage() {
  const { Title } = Typography;
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form] = Form.useForm();

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await bannerService.getAll();
      setBanners(res.data.data);
    } catch {
      message.error("Không tải được banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSubmit = async () => {
    const values = await form.validateFields();

    try {
      if (editing) {
        await bannerService.update(editing.id, values);
        message.success("Cập nhật banner thành công");
      } else {
        await bannerService.create(values);
        message.success("Thêm banner thành công");
      }

      setOpen(false);
      setEditing(null);
      form.resetFields();
      fetchBanners();
    } catch {
      message.error("Thao tác thất bại");
    }
  };
  const displayOrderOptions = Array.from(
    { length: banners.length + 1 },
    (_, i) => ({
      label: i + 1,
      value: i + 1,
    }),
  );

  const columns: ColumnsType<Banner> = [
    {
      title: "Thứ tự",
      dataIndex: "displayOrder",
      width: 90,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
    },
    {
      title: "Hình ảnh",
      dataIndex: "imageUrl",
      render: (url) => (
        <img
          src={url}
          alt="banner"
          style={{
            width: 280,
            height: 140,
            objectFit: "cover",
            border: "1px solid #e5e7eb",
          }}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      align: "center",
      render: (isActive: boolean) =>
        isActive ? <Tag color="green">Hiện</Tag> : <Tag color="red">Ẩn</Tag>,
    },
    {
      title: "Hành động",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            style={{ color: "#52c41a" }}
            onClick={() => {
              setEditing(record);
              form.setFieldsValue(record);
              setOpen(true);
            }}
          />

          <Popconfirm
            title="Xóa banner này?"
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={async () => {
              await bannerService.delete(record.id);
              message.success("Đã xóa banner");
              fetchBanners();
            }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Quản lý banner
          </Title>
        </Col>

        <Col>
          <Button
            type="primary"
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            Thêm banner
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={banners}
        loading={loading}
      />

      <Modal
        open={open}
        title={editing ? "Sửa banner" : "Thêm banner"}
        onOk={handleSubmit}
        onCancel={() => setOpen(false)}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="imageUrl"
            label="Image URL"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="title" label="Tiêu đề">
            <Input />
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Thứ tự hiển thị"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Chọn vị trí hiển thị"
              options={displayOrderOptions}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
