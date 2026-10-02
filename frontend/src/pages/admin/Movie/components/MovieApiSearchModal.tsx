import { Modal, Space, Input, List, Avatar } from "antd";
import type { ApiMovie } from "@/types/Movie";

interface MovieApiSearchModalProps {
  open: boolean;
  results: ApiMovie[];
  onSearch: (value: string) => void;
  onSelect: (item: ApiMovie) => void;
  onClose: () => void;
}

const MovieApiSearchModal: React.FC<MovieApiSearchModalProps> = ({
  open,
  results,
  onSearch,
  onSelect,
  onClose,
}) => (
  <Modal title="Tìm phim từ API" open={open} footer={null} onCancel={onClose}>
    <Space direction="vertical" style={{ width: "100%" }}>
      <Input.Search
        placeholder="Nhập tên phim API"
        allowClear
        enterButton="Tìm"
        onSearch={onSearch}
        style={{ width: "100%" }}
      />
      <List
        bordered
        dataSource={results}
        renderItem={(item) => (
          <List.Item
            onClick={() => onSelect(item)}
            style={{ cursor: "pointer" }}
          >
            <List.Item.Meta
              avatar={<Avatar shape="square" size={100} src={item.Poster} />}
              title={<span style={{ fontWeight: 500 }}>{item.Title}</span>}
              description={
                <span style={{ fontSize: 12, color: "#888" }}>{item.Year}</span>
              }
            />
          </List.Item>
        )}
        style={{ maxHeight: 400, overflowY: "auto" }}
      />
    </Space>
  </Modal>
);

export default MovieApiSearchModal;
