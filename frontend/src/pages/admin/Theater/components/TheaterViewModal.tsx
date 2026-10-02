import { Modal, Form, Input, Button } from "antd";
import type { FormInstance } from "antd";
import type { Theater } from "@/types/Theater";

interface TheaterViewModalProps {
  open: boolean;
  viewForm: FormInstance<Theater>;
  onClose: () => void;
}

const TheaterViewModal: React.FC<TheaterViewModalProps> = ({
  open,
  viewForm,
  onClose,
}) => (
  <Modal
    title="Chi tiết Rạp"
    open={open}
    onCancel={onClose}
    footer={[
      <Button key="close" onClick={onClose}>
        Đóng
      </Button>,
    ]}
  >
    <Form form={viewForm} layout="vertical">
      <Form.Item label="ID">
        <Input readOnly value={String(viewForm.getFieldValue("id") ?? "")} />
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
);

export default TheaterViewModal;
