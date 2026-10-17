import React, { useState } from "react";
import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faArrowLeft,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { message, Input, Button } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/authService";
import { getErrorMessage } from "@/utils/getErrorMessage";

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 100;

const gradientButtonStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, #0a64a7 0%, #258dcf 51%, #3db1f3 100%)",
  border: "none",
  color: "white",
  fontWeight: 600,
  boxShadow: "0 4px 15px rgba(37, 141, 207, 0.3)",
};

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      message.error("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (
      newPassword.length < PASSWORD_MIN_LENGTH ||
      newPassword.length > PASSWORD_MAX_LENGTH
    ) {
      message.error(
        `Mật khẩu phải từ ${PASSWORD_MIN_LENGTH} đến ${PASSWORD_MAX_LENGTH} ký tự`
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setSubmitting(true);
    try {
      const msg = await authService.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });
      message.success(msg || "Đặt lại mật khẩu thành công");
      navigate("/login", { replace: true });
    } catch (err) {
      message.error(getErrorMessage(err, "Đặt lại mật khẩu thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 pt-8 pb-2 text-center">
          <h1 className="text-2xl font-bold text-[#03599d] mb-2">
            ĐẶT LẠI MẬT KHẨU
          </h1>
          {token && (
            <p className="text-gray-500">
              Nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          )}
        </div>

        <div className="p-8 pt-4">
          {!token ? (
            <div className="flex flex-col items-center text-center gap-4">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="text-5xl text-red-500"
              />
              <p className="text-gray-700">
                Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
              </p>
              <Link
                to="/forgot-password"
                className="text-sm font-medium !text-[#03599d] hover:underline"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Gửi lại yêu cầu đặt lại mật khẩu
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <Input.Password
                  size="large"
                  prefix={
                    <FontAwesomeIcon
                      icon={faLock}
                      className="text-gray-400 mr-2"
                    />
                  }
                  placeholder="Nhập mật khẩu mới"
                  name="newPassword"
                  autoComplete="new-password"
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nhập lại mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <Input.Password
                  size="large"
                  prefix={
                    <FontAwesomeIcon
                      icon={faLock}
                      className="text-gray-400 mr-2"
                    />
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  name="confirmPassword"
                  autoComplete="new-password"
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="mt-4">
                <Button
                  htmlType="submit"
                  block
                  size="large"
                  loading={submitting}
                  style={gradientButtonStyle}
                  className="h-12 text-base hover:opacity-90 transition-opacity"
                >
                  ĐẶT LẠI MẬT KHẨU
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium !text-[#03599d] hover:underline"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                  Quay lại đăng nhập
                </Link>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium !text-[#03599d] hover:underline"
                >
                  Liên kết hết hạn? Gửi lại yêu cầu
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
