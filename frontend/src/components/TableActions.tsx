import { Button, Popconfirm, Space } from "antd";
import { DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  deleteTitle?: string;
  deleteDisabled?: boolean;
}

const iconStyle = { fontSize: 18 };

const TableActions: React.FC<TableActionsProps> = ({
  onView,
  onEdit,
  onDelete,
  deleteTitle = "Xác nhận xóa?",
  deleteDisabled,
}) => (
  <Space size="small">
    {onView && (
      <Button
        type="text"
        icon={<EyeOutlined style={iconStyle} />}
        style={{ color: "#1677ff" }}
        onClick={onView}
      />
    )}
    {onEdit && (
      <Button
        type="text"
        icon={<EditOutlined style={iconStyle} />}
        style={{ color: "#52c41a" }}
        onClick={onEdit}
      />
    )}
    {onDelete && (
      <Popconfirm
        title={deleteTitle}
        onConfirm={onDelete}
        okText="Xóa"
        cancelText="Hủy"
        disabled={deleteDisabled}
      >
        <Button
          type="text"
          danger
          disabled={deleteDisabled}
          icon={<DeleteOutlined style={iconStyle} />}
        />
      </Popconfirm>
    )}
  </Space>
);

export default TableActions;
