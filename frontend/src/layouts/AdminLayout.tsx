import React, { useMemo } from "react";
import { Button, Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  VideoCameraOutlined,
  LogoutOutlined,
  HomeOutlined,
  CalendarOutlined,
  ProfileOutlined,
  UserOutlined,
  PictureOutlined,
  ReadOutlined,
  AreaChartOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo-cinema2.png";
import { useAuth } from "@/context/AuthContext";

const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const items: MenuProps["items"] = useMemo(
    () => [
      {
        key: "/admin/dashboard",
        icon: <AreaChartOutlined />,
        label: <Link to="/admin/dashboard">Thống kê</Link>,
      },
      {
        key: "/admin/movie",
        icon: <VideoCameraOutlined />,
        label: <Link to="/admin/movie">Phim</Link>,
      },
      {
        key: "/admin/theater",
        icon: <HomeOutlined />,
        label: <Link to="/admin/theater">Rạp chiếu</Link>,
      },
      {
        key: "/admin/showtime",
        icon: <CalendarOutlined />,
        label: <Link to="/admin/showtime">Lịch chiếu</Link>,
      },
      {
        key: "/admin/reservations",
        icon: <ProfileOutlined />,
        label: <Link to="/admin/reservations">Đơn đặt</Link>,
      },
      {
        key: "/admin/users",
        icon: <UserOutlined />,
        label: <Link to="/admin/users">Tài khoản</Link>,
      },
      {
        key: "/admin/banner",
        icon: <PictureOutlined />,
        label: <Link to="/admin/banner">Banner</Link>,
      },
      {
        key: "/admin/news",
        icon: <ReadOutlined />,
        label: <Link to="/admin/news">Bài viết</Link>,
      },
    ],
    [],
  );

  const selected =
    items.find(
      (i) => typeof i?.key === "string" && pathname.startsWith(String(i.key)),
    )?.key ?? items[0]?.key;

  const siderWidth = 250;
  const headerHeight = 64;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight,
          zIndex: 1000,
          background: "#1677ff",
          padding: "0 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={logo} alt="logo" style={{ height: 100 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>
            Xin chào, Admin
          </span>
        </div>
      </Header>

      <Sider
        width={siderWidth}
        style={{
          position: "fixed",
          top: headerHeight,
          left: 0,
          height: `calc(100vh - ${headerHeight}px)`,
          overflow: "auto",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[String(selected)]}
              items={items}
              style={{ fontSize: "16px", fontWeight: "500", padding: "8px 0" }}
            />
          </div>

          <div
            style={{
              padding: "16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Button
              type="primary"
              danger
              block
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </Sider>

      <Layout style={{ marginLeft: siderWidth, marginTop: headerHeight }}>
        <Content
          style={{
            margin: 20,
            padding: 24,
            background: "#fff",
            borderRadius: 8,
            minHeight: `calc(100vh - ${headerHeight + 40}px)`,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
export default AdminLayout;
