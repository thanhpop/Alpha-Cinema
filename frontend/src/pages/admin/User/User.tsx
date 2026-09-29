import React, { useEffect, useMemo, useState } from "react";
import { Table, Typography, Spin, message, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { userService, type User } from "@/services/userService";

const { Title } = Typography;
const { Search } = Input;
const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const filteredUsers = useMemo(() => {
    if (!searchText) return users;
    return users.filter((u) =>
      u.username.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [users, searchText]);

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
        placeholder="Tìm theo username"
        allowClear
        style={{ width: 300, marginBottom: 16 }}
        enterButton
        onChange={(e) => setSearchText(e.target.value)}
      />
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          bordered
          pagination={{ pageSize: 5 }}
        />
      </Spin>
    </div>
  );
};

export default UserManagementPage;
