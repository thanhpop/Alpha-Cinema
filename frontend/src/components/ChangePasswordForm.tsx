import React, { useState } from "react";
import { Button, Form, Input, message } from "antd";
import { LockOutlined, SaveOutlined } from "@ant-design/icons";

import { authService } from "@/services/authService";
import type { ChangePasswordPayload } from "@/types/Auth";
import { getErrorMessage } from "@/utils/getErrorMessage";

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 100;

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
}) => {
  const [form] = Form.useForm<ChangePasswordPayload>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values: ChangePasswordPayload) => {
    setSubmitting(true);
    try {
      const msg = await authService.changePassword(values);
      message.success(msg || "Đổi mật khẩu thành công!");
      form.resetFields();
      onSuccess?.();
    } catch (err) {
      message.error(getErrorMessage(err, "Đổi mật khẩu thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form<ChangePasswordPayload>
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      className="max-w-md"
    >
      <Form.Item
        label="Mật khẩu hiện tại"
        name="currentPassword"
        rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại" }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Nhập mật khẩu hiện tại"
          autoComplete="current-password"
        />
      </Form.Item>
      <Form.Item
        label="Mật khẩu mới"
        name="newPassword"
        dependencies={["currentPassword"]}
        rules={[
          { required: true, message: "Vui lòng nhập mật khẩu mới" },
          {
            min: PASSWORD_MIN_LENGTH,
            max: PASSWORD_MAX_LENGTH,
            message: `Mật khẩu phải từ ${PASSWORD_MIN_LENGTH} đến ${PASSWORD_MAX_LENGTH} ký tự`,
          },
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              value && value === getFieldValue("currentPassword")
                ? Promise.reject(
                    new Error("Mật khẩu mới phải khác mật khẩu hiện tại"),
                  )
                : Promise.resolve(),
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Nhập mật khẩu mới"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
        />
      </Form.Item>
      <Form.Item
        label="Nhập lại mật khẩu mới"
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={[
          { required: true, message: "Vui lòng nhập lại mật khẩu mới" },
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              !value || value === getFieldValue("newPassword")
                ? Promise.resolve()
                : Promise.reject(new Error("Mật khẩu xác nhận không khớp")),
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
        />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        icon={<SaveOutlined />}
        loading={submitting}
        className="bg-blue-600"
      >
        Đổi mật khẩu
      </Button>
    </Form>
  );
};

export default ChangePasswordForm;
