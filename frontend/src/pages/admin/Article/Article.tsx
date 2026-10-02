import { useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
  Image,
  Form,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import AddButton from "@/components/AddButton";
import type { ColumnsType } from "antd/es/table";
import { articleService } from "@/services/ArticleService";
import type { Article } from "@/types/Article";
import { usePagedList } from "@/hooks/usePagedList";
import ArticleFormModal from "@/pages/admin/Article/components/ArticleFormModal";

const { Title } = Typography;

export default function ArticleManagementPage() {
  const {
    items: data,
    loading,
    reload: fetchArticles,
    pagination,
  } = usePagedList(articleService.getPaged, {
    initialFilters: {},
    onError: () => message.error("Không tải được danh sách bài viết"),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [content, setContent] = useState("");

  const [form] = Form.useForm();

  const openCreate = () => {
    setEditing(null);
    setContent("");
    form.resetFields();
    form.setFieldValue("isActive", true);
    setOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditing(article);
    setContent(article.content);
    form.setFieldsValue(article);
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();

    const payload = {
      ...values,
      content,
    };

    try {
      if (editing) {
        await articleService.update(editing.id, payload);
        message.success("Cập nhật bài viết thành công");
      } else {
        await articleService.create(payload);
        message.success("Thêm bài viết thành công");
      }

      setOpen(false);
      fetchArticles();
    } catch {
      message.error("Thao tác thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await articleService.delete(id);
      message.success("Xóa bài viết thành công");
      fetchArticles();
    } catch {
      message.error("Xóa thất bại");
    }
  };

  const columns: ColumnsType<Article> = [
    {
      title: "Ảnh",
      dataIndex: "imageUrl",
      width: 120,
      render: (url) => (
        <Image
          src={url}
          width={100}
          height={60}
          style={{ objectFit: "cover", borderRadius: 6 }}
        />
      ),
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "Tóm tắt",
      dataIndex: "summary",
      ellipsis: true,
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      width: 140,
      render: (c) => (
        <Tag color={c === "Promotion" ? "red" : "blue"}>
          {c === "Promotion" ? "Khuyến mãi" : "Điện ảnh"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      width: 120,
      render: (v) => (v ? <Tag color="green">Hiển thị</Tag> : <Tag>Ẩn</Tag>),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 160,
    },
    {
      title: "Hành động",
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="primary"
            ghost
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Xóa bài viết?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Title level={3}>Quản lý bài viết</Title>
        <AddButton onClick={openCreate}>Thêm bài viết</AddButton>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={pagination}
      />

      <ArticleFormModal
        open={open}
        isEditing={!!editing}
        form={form}
        content={content}
        onContentChange={setContent}
        onOk={handleSubmit}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
