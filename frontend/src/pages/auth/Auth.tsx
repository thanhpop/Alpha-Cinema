import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faLock,
  faEnvelope,
  faPhoneSquare,
  faMars,
  faVenus,
  faGenderless,
} from "@fortawesome/free-solid-svg-icons";
import { message, Tabs, Input, Button, DatePicker, Select } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";

const { Option } = Select;

interface LoginForm {
  username: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  dob: string;
  gender: string;
  phone: string;
  roles: string[];
}

const Auth: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("login");

  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: "",
    gender: "",
    phone: "",
    roles: ["user"],
  });

  const handleLoginChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, name: string) => {
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (_: any, dateString: string | string[]) => {
    setRegisterForm((prev) => ({ ...prev, dob: dateString as string }));
  };

  const handleLoginSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    try {
      const data = await authService.login({
        username: loginForm.username,
        password: loginForm.password,
      });

      const userData = {
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role,
      };

      login(userData, data.accessToken);
      if (userData.role === "ADMIN") {
        message.success("Đăng nhập thành công!");
        navigate("/admin", { replace: true });
      } else {
        message.success("Đăng nhập thành công!");
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Đăng nhập thất bại";
      message.error(errorMessage);
    }
  };

  const handleRegisterSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      message.error("Mật khẩu và xác nhận mật khẩu không khớp");
      return;
    }

    try {
      await authService.register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword,
        dob: registerForm.dob,
        gender: registerForm.gender,
        phone: registerForm.phone,
        role: registerForm.roles,
      });

      message.success("Đăng ký thành công");
      setActiveTab("login");
    } catch (err: any) {
      message.error(err.message || "Đăng ký thất bại");
    }
  };

  const gradientButtonStyle: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(to right, #0a64a7 0%, #258dcf 51%, #3db1f3 100%)",
    border: "none",
    color: "white",
    fontWeight: 600,
    boxShadow: "0 4px 15px rgba(37, 141, 207, 0.3)",
  };

  return (
    <div
      className="flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 pt-6 pb-2 bg-white">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            size="large"
            items={[
              { label: "ĐĂNG NHẬP", key: "login" },
              { label: "ĐĂNG KÝ", key: "register" },
            ]}
            className="font-medium"
          />
        </div>

        <div className="p-8 pt-4">
          {activeTab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tên đăng nhập
                </label>
                <Input
                  size="large"
                  prefix={
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-gray-400 mr-2"
                    />
                  }
                  placeholder="Nhập tên đăng nhập"
                  name="username"
                  value={loginForm.username}
                  onChange={handleLoginChange}
                  className="hover:border-[#03599d] focus:border-[#03599d]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <Input.Password
                  size="large"
                  prefix={
                    <FontAwesomeIcon
                      icon={faLock}
                      className="text-gray-400 mr-2"
                    />
                  }
                  placeholder="Nhập mật khẩu"
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                />
              </div>

              <div className="mt-4">
                <Button
                  htmlType="submit"
                  block
                  size="large"
                  style={gradientButtonStyle}
                  className="h-12 text-base hover:opacity-90 transition-opacity"
                >
                  ĐĂNG NHẬP
                </Button>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleRegisterSubmit}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <Input
                    size="large"
                    prefix={
                      <FontAwesomeIcon
                        icon={faUser}
                        className="text-gray-400 mr-2"
                      />
                    }
                    placeholder="Nhập tên đăng nhập"
                    name="username"
                    value={registerForm.username}
                    onChange={handleRegisterChange}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
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
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <Input.Password
                    size="large"
                    prefix={
                      <FontAwesomeIcon
                        icon={faLock}
                        className="text-gray-400 mr-2"
                      />
                    }
                    placeholder="Mật khẩu"
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <Input.Password
                    size="large"
                    prefix={
                      <FontAwesomeIcon
                        icon={faLock}
                        className="text-gray-400 mr-2"
                      />
                    }
                    placeholder="Nhập lại mật khẩu"
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    size="large"
                    className="w-full"
                    placeholder="Chọn ngày sinh"
                    format="YYYY-MM-DD"
                    value={registerForm.dob ? dayjs(registerForm.dob) : null}
                    onChange={handleDateChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Giới tính
                  </label>
                  <Select
                    size="large"
                    className="w-full"
                    placeholder="Chọn giới tính"
                    value={registerForm.gender || undefined}
                    onChange={(val) => handleSelectChange(val, "gender")}
                  >
                    <Option value="male">
                      <FontAwesomeIcon
                        icon={faMars}
                        className="mr-2 text-blue-500"
                      />{" "}
                      Nam
                    </Option>
                    <Option value="female">
                      <FontAwesomeIcon
                        icon={faVenus}
                        className="mr-2 text-pink-500"
                      />{" "}
                      Nữ
                    </Option>
                    <Option value="other">
                      <FontAwesomeIcon
                        icon={faGenderless}
                        className="mr-2 text-gray-500"
                      />{" "}
                      Khác
                    </Option>
                  </Select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <Input
                    size="large"
                    prefix={
                      <FontAwesomeIcon
                        icon={faPhoneSquare}
                        className="text-gray-400 mr-2"
                      />
                    }
                    placeholder="0912 xxx xxx"
                    name="phone"
                    value={registerForm.phone}
                    onChange={handleRegisterChange}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  htmlType="submit"
                  block
                  size="large"
                  style={gradientButtonStyle}
                  className="h-12 text-base hover:opacity-90 transition-opacity"
                >
                  ĐĂNG KÝ
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
