import { Modal, Form, Input, Select, DatePicker, Row, Col } from "antd";
import type { FormInstance } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  GENDER_OPTIONS,
  PHONE_PATTERN,
  type Gender,
} from "@/services/userService";

export interface UserFormValues {
  username: string;
  email: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: Dayjs | null;
}

interface UserFormModalProps {
  open: boolean;
  saving: boolean;
  form: FormInstance<UserFormValues>;
  onOk: () => void;
  onCancel: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  saving,
  form,
  onOk,
  onCancel,
}) => (
  <Modal
    title="Sửa người dùng"
    open={open}
    onCancel={onCancel}
    width={700}
    okText="Lưu"
    cancelText="Hủy"
    onOk={onOk}
    confirmLoading={saving}
    forceRender
  >
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        <Col span={24} md={12}>
          <Form.Item name="username" label="Tên người dùng">
            <Input disabled />
          </Form.Item>
        </Col>
        <Col span={24} md={12}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={24} md={12}>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              {
                pattern: PHONE_PATTERN,
                message: "Số điện thoại không hợp lệ (VD: 0912345678)",
              },
            ]}
          >
            <Input placeholder="VD: 0912345678" />
          </Form.Item>
        </Col>
        <Col span={24} md={12}>
          <Form.Item name="gender" label="Giới tính">
            <Select
              placeholder="Chọn giới tính"
              options={GENDER_OPTIONS}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col span={24} md={12}>
          <Form.Item name="dateOfBirth" label="Ngày sinh">
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sinh"
              disabledDate={(d) => d.isAfter(dayjs(), "day")}
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </Modal>
);

export default UserFormModal;
