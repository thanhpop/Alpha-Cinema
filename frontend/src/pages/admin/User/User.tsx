import React, { useEffect, useState } from "react";
import {
  Table,
  Typography,
  Spin,
  message,
  Input,
  Button,
  Space,
  Popconfirm,
  Form,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  userService,
  GENDER_OPTIONS,
  type User,
} from "@/services/userService";
import { usePagedList } from "@/hooks/usePagedList";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/utils/getErrorMessage";
import UserFormModal, {
  type UserFormValues,
} from "@/pages/admin/User/components/UserFormModal";

const { Title } = Typography;
const { Search } = Input;

const genderLabel = (value: User["gender"]) =>
  GENDER_OPTIONS.find((g) => g.value === value)?.label ?? "-";

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { items: users, loading, setFilters, reload, pagination } = usePagedList(
    userService.getPaged,
    {
      initialFilters: { search: "" },
      initialPageSize: 5,
      onError: () => message.error("Không thể tải danh sách người dùng"),
    },
  );
  const [searchText, setSearchText] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<UserFormValues>();

  // Tìm khi đang gõ nhưng đợi dừng gõ mới gọi API
  useEffect(() => {
    const timer = setTimeout(() => setFilters({ search: searchText.trim() }), 400);
    return () => clearTimeout(timer);
  }, [searchText, setFilters]);

  const openEditModal = (record: User) => {
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      phone: record.phone ?? "",
      gender: record.gender ?? undefined,
      dateOfBirth: record.dateOfBirthIso ? dayjs(record.dateOfBirthIso) : null,
    });
    setEditing(record);
  };

  const closeEditModal = () => {
    form.resetFields();
    setEditing(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    setSaving(true);
    try {
      await userService.update(editing.id, {
        email: values.email.trim(),
        phone: values.phone?.trim() || null,
        gender: values.gender ?? null,
        dateOfBirth: values.dateOfBirth?.format("YYYY-MM-DD") ?? null,
      });
      message.success("Cập nhật người dùng thành công");
      closeEditModal();
      reload();
    } catch (err) {
      message.error(getErrorMessage(err, "Cập nhật người dùng thất bại"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await userService.delete(id);
      message.success("Xóa người dùng thành công");
      reload();
    } catch (err) {
      message.error(getErrorMessage(err, "Xóa người dùng thất bại"));
    }
  };

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
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (v: string | null) => v || "-",
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      width: 100,
      render: genderLabel,
    },
    {
      title: "Ngày sinh",
      dataIndex: "dateOfBirth",
      key: "dateOfBirth",
      width: 120,
      render: (v: string | null) => v || "-",
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: "#52c41a", fontSize: 18 }} />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title={`Xóa người dùng "${record.username}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            disabled={record.id === currentUser?.userId}
          >
            <Button
              type="text"
              disabled={record.id === currentUser?.userId}
              icon={<DeleteOutlined style={{ fontSize: 18 }} />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Quản lý người dùng</Title>
      <Search
        placeholder="Tìm theo username, email hoặc số điện thoại"
        allowClear
        style={{ width: 360, marginBottom: 16 }}
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

      <UserFormModal
        open={!!editing}
        saving={saving}
        form={form}
        onOk={handleSave}
        onCancel={closeEditModal}
      />
    </div>
  );
};

export default UserManagementPage;
