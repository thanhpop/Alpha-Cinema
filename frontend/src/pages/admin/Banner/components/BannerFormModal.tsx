import { Modal, Form, Input, Select, Switch } from "antd";
import type { FormInstance } from "antd";

interface BannerFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: FormInstance;
  // Tổng số banner hiện có, dùng để sinh các vị trí hiển thị 1..total+1
  totalBanners: number;
  onOk: () => void;
  onCancel: () => void;
}

const BannerFormModal: React.FC<BannerFormModalProps> = ({
  open,
  isEditing,
  form,
  totalBanners,
  onOk,
  onCancel,
}) => {
  const displayOrderOptions = Array.from(
    { length: totalBanners + 1 },
    (_, i) => ({
      label: i + 1,
      value: i + 1,
    }),
  );

  return (
    <Modal
      open={open}
      title={isEditing ? "Sửa banner" : "Thêm banner"}
      onOk={onOk}
      onCancel={onCancel}
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
  );
};

export default BannerFormModal;
