import React, { useEffect, useState } from "react";
import { Table, Typography, Spin, message, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { userService, type User } from "@/services/userService";
import { usePagedList } from "@/hooks/usePagedList";

const { Title } = Typography;
const { Search } = Input;
const UserManagementPage: React.FC = () => {
  const { items: users, loading, setFilters, pagination } = usePagedList(
    userService.getPaged,
    {
      initialFilters: { search: "" },
      initialPageSize: 5,
      onError: () => message.error("Không thể tải danh sách người dùng"),
    },
  );
  const [searchText, setSearchText] = useState("");

  // Tìm khi đang gõ nhưng đợi dừng gõ mới gọi API
  useEffect(() => {
    const timer = setTimeout(() => setFilters({ search: searchText.trim() }), 400);
    return () => clearTimeout(timer);
  }, [searchText, setFilters]);

  const columns: ColumnsType<User> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý người dùng</Title>
      <Search
        placeholder="Tìm theo username hoặc email"
        allowClear
        style={{ width: 300, marginBottom: 16 }}
        enterButton
        onChange={(e) => setSearchText(e.target.value)}
      />
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          bordered
          pagination={pagination}
        />
      </Spin>
    </div>
  );
};

export default UserManagementPage;
