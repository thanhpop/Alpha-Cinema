import { Modal, Form, Input, Select, Switch } from "antd";
import type { FormInstance } from "antd";
import QuillEditor from "@/components/QuillEditor";

const { TextArea } = Input;

interface ArticleFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: FormInstance;
  content: string;
  onContentChange: (value: string) => void;
  onOk: () => void;
  onCancel: () => void;
}

const ArticleFormModal: React.FC<ArticleFormModalProps> = ({
  open,
  isEditing,
  form,
  content,
  onContentChange,
  onOk,
  onCancel,
}) => (
  <Modal
    open={open}
    title={isEditing ? "Sửa bài viết" : "Thêm bài viết"}
    width={900}
    onCancel={onCancel}
    onOk={onOk}
    okText="Lưu"
  >
    <Form layout="vertical" form={form}>
      <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item name="summary" label="Tóm tắt" rules={[{ required: true }]}>
        <TextArea rows={3} showCount maxLength={300} />
      </Form.Item>

      <Form.Item
        name="imageUrl"
        label="Ảnh đại diện"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="category" label="Danh mục" rules={[{ required: true }]}>
        <Select
          options={[
            { label: "Điện ảnh", value: "Movie" },
            { label: "Khuyến mãi", value: "Promotion" },
          ]}
        />
      </Form.Item>

      <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item label="Nội dung bài viết">
        <QuillEditor value={content} onChange={onContentChange} />
      </Form.Item>
    </Form>
  </Modal>
);

export default ArticleFormModal;
