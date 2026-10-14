import React from "react";
import { Layout, Menu, Button } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { LogoutOutlined } from "@ant-design/icons";
import logoImage from "@/assets/logo2.png";
import { useAuth } from "@/context/AuthContext";

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith("/news")) return ["news"];
    if (path === "/") return ["home"];
    return [];
  };

  return (
    <Header
      style={{ background: "#ffffff" }}
      className="shadow-sm sticky top-0 z-50 flex items-center justify-between px-4 md:px-12 h-20 border-b border-gray-100"
    >
      <div className="flex items-center gap-8">
        <div
          className="cursor-pointer flex items-center"
          onClick={() => navigate("/")}
        >
          <img
            src={logoImage}
            alt="Logo"
            className="h-28 w-auto object-contain"
          />
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={getSelectedKey()}
          style={{ background: "transparent", borderBottom: "none" }}
          className="hidden md:flex min-w-[300px] text-base font-medium"
          items={[
            { key: "home", label: "Trang Chủ", onClick: () => navigate("/") },
            {
              key: "articles",
              label: "Tin Tức và ưu đãi",
              onClick: () => navigate("/articles"),
            },
          ]}
        />
      </div>

      <div className="flex items-center gap-4 min-w-0">
        {user ? (
          <div className="flex items-center gap-1 sm:gap-3 min-w-0">
            <div
              className="cursor-pointer flex items-center min-w-0 hover:opacity-70 transition-opacity"
              onClick={() => navigate("/profile")}
              title="Xem thông tin tài khoản"
            >
              <span className="flex items-center min-w-0 font-medium text-gray-700 select-none whitespace-nowrap leading-normal">
                <span className="hidden sm:inline">Xin chào,&nbsp;</span>
                <span className="text-blue-600 font-bold truncate max-w-[110px] sm:max-w-[200px]">
                  {user.username}
                </span>
              </span>
            </div>

            <Button
              type="text"
              danger
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              title="Đăng xuất"
              className="font-medium hover:bg-red-50"
            >
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
          </div>
        ) : (
          <>
            <Button
              type="text"
              className="font-medium hover:text-blue-600"
              onClick={() => navigate(`/login`)}
            >
              Đăng Nhập
            </Button>
            <Button
              type="primary"
              shape="round"
              className="bg-blue-600 font-semibold hover:bg-blue-500"
              onClick={() => navigate(`/login`)}
            >
              Đăng Ký
            </Button>
          </>
        )}
      </div>
    </Header>
  );
};

export default AppHeader;
