import { Modal, Form, Input, InputNumber } from "antd";
import type { FormInstance } from "antd";
import type { Theater } from "@/types/Theater";

interface TheaterFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: FormInstance<Theater>;
  onOk: () => void;
  onCancel: () => void;
}

const TheaterFormModal: React.FC<TheaterFormModalProps> = ({
  open,
  isEditing,
  form,
  onOk,
  onCancel,
}) => (
  <Modal
    title={isEditing ? "Sửa Rạp" : "Tạo Rạp mới"}
    open={open}
    onCancel={onCancel}
    width={700}
    okText={isEditing ? "Lưu" : "Tạo"}
    onOk={onOk}
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
);

export default TheaterFormModal;
