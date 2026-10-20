import { useState } from "react";
import { Table, Form, message } from "antd";

import AddButton from "@/components/AddButton";
import TableActions from "@/components/TableActions";
import type { ColumnsType } from "antd/es/table";
import type { Banner } from "@/types/Banner";
import { bannerService } from "@/services/bannerService";
import { usePagedList } from "@/hooks/usePagedList";
import { Typography, Row, Col, Tag } from "antd";
import BannerFormModal from "@/pages/admin/Banner/components/BannerFormModal";

export default function BannerPage() {
  const { Title } = Typography;
  const {
    items: banners,
    total,
    loading,
    reload: fetchBanners,
    pagination,
  } = usePagedList(bannerService.getPaged, {
    initialFilters: {},
    onError: () => message.error("Không tải được banner"),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form] = Form.useForm();

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
      width: 120,
      align: "center",
      render: (_, record) => (
        <TableActions
          onEdit={() => {
            setEditing(record);
            form.setFieldsValue(record);
            setOpen(true);
          }}
          onDelete={async () => {
            await bannerService.delete(record.id);
            message.success("Đã xóa banner");
            fetchBanners();
          }}
          deleteTitle="Xóa banner này?"
        />
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
          <AddButton
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            Thêm banner
          </AddButton>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={banners}
        loading={loading}
        pagination={pagination}
      />

      <BannerFormModal
        open={open}
        isEditing={!!editing}
        form={form}
        totalBanners={total}
        onOk={handleSubmit}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
