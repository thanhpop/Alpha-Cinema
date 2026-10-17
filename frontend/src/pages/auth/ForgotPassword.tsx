import React, { useState } from "react";
import type { FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faArrowLeft,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { message, Input, Button } from "antd";
import { Link } from "react-router-dom";
import { authService } from "@/services/authService";
import { getErrorMessage } from "@/utils/getErrorMessage";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const gradientButtonStyle: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, #0a64a7 0%, #258dcf 51%, #3db1f3 100%)",
  border: "none",
  color: "white",
  fontWeight: 600,
  boxShadow: "0 4px 15px rgba(37, 141, 207, 0.3)",
};

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      message.error("Vui lòng nhập email hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      const msg = await authService.forgotPassword(trimmedEmail);
      setSentMessage(
        msg || "Đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư."
      );
    } catch (err) {
      message.error(getErrorMessage(err, "Gửi yêu cầu thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  const backToLoginLink = (
    <div className="text-center">
      <Link
        to="/login"
        className="text-sm font-medium !text-[#03599d] hover:underline"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
        Quay lại đăng nhập
      </Link>
    </div>
  );

  return (
    <div
      className="flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 pt-8 pb-2 text-center">
          <h1 className="text-2xl font-bold text-[#03599d] mb-2">
            QUÊN MẬT KHẨU
          </h1>
          {!sentMessage && (
            <p className="text-gray-500">
              Nhập email bạn đã dùng để đăng ký, chúng tôi sẽ gửi hướng dẫn đặt
              lại mật khẩu cho bạn.
            </p>
          )}
        </div>

        <div className="p-8 pt-4">
          {sentMessage ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-3">
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="text-5xl text-green-500"
                />
                <p className="text-gray-700">{sentMessage}</p>
                <p className="text-sm text-gray-500">
                  Không nhận được email? Kiểm tra thư mục spam hoặc{" "}
                  <button
                    type="button"
                    onClick={() => setSentMessage(null)}
                    className="font-medium text-[#03599d] hover:underline cursor-pointer"
                  >
                    gửi lại yêu cầu
                  </button>
                  .
                </p>
              </div>
              {backToLoginLink}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  size="large"
                  prefix={
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="text-gray-400 mr-2"
                    />
                  }
                  placeholder="example@email.com"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  GỬI YÊU CẦU
                </Button>
              </div>

              {backToLoginLink}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
