import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface AddButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

// Nút "Thêm" dùng chung cho các trang admin để cùng kích thước
const AddButton: React.FC<AddButtonProps> = ({ children, onClick }) => (
  <Button
    type="primary"
    icon={<PlusOutlined />}
    onClick={onClick}
    style={{ minWidth: 160 }}
  >
    {children}
  </Button>
);

export default AddButton;
