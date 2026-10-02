import {
  Modal,
  Form,
  Select,
  Space,
  Row,
  Col,
  DatePicker,
  TimePicker,
  InputNumber,
} from "antd";
import type { FormInstance } from "antd";
import type { Movie } from "@/types/Movie";
import type { Theater } from "@/types/Theater";

interface ShowtimeFormModalProps {
  open: boolean;
  isEditing: boolean;
  saving: boolean;
  form: FormInstance;
  movies: Movie[];
  theaters: Theater[];
  onOk: () => void;
  onCancel: () => void;
}

const POSTER_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='56'><rect width='100%' height='100%' fill='%23e6e6e6'/></svg>";

const ShowtimeFormModal: React.FC<ShowtimeFormModalProps> = ({
  open,
  isEditing,
  saving,
  form,
  movies,
  theaters,
  onOk,
  onCancel,
}) => (
  <Modal
    title={isEditing ? `Sửa lịch chiếu ` : "Tạo mới"}
    open={open}
    onCancel={onCancel}
    onOk={onOk}
    confirmLoading={saving}
    width={720}
  >
    <Form form={form} layout="vertical">
      <Form.Item name="movieId" label="Phim" rules={[{ required: true }]}>
        <Select
          placeholder="Chọn phim"
          optionLabelProp="label"
          showSearch
          filterOption={(input, option) => {
            const title = option?.label?.toString().toLowerCase() ?? "";
            return title.includes(input.toLowerCase());
          }}
        >
          {movies.map((m) => (
            <Select.Option key={m.id} value={m.id} label={m.title}>
              <Space>
                <img
                  src={m.poster || ""}
                  alt={m.title}
                  style={{
                    width: 75,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = POSTER_FALLBACK;
                  }}
                />
                <span>{m.title}</span>
              </Space>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="theaterId" label="Rạp" rules={[{ required: true }]}>
        <Select
          placeholder="Chọn rạp"
          optionLabelProp="label"
          showSearch
          filterOption={(input, option) => {
            const lab = option?.label?.toString().toLowerCase() ?? "";
            return lab.includes(input.toLowerCase());
          }}
        >
          {theaters.map((t) => (
            <Select.Option
              key={t.id}
              value={t.id}
              label={`${t.name} — ${t.location ?? ""}`}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600 }}>{t.name}</span>
                <span style={{ color: "#888", fontSize: 12 }}>
                  {t.location}
                </span>
              </div>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item
            name="showDate"
            label="Ngày chiếu"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="showTime"
            label="Giờ chiếu"
            rules={[{ required: true }]}
          >
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="price" label="Giá (VNĐ)" rules={[{ required: true }]}>
        <InputNumber style={{ width: "100%" }} min={0} />
      </Form.Item>

      <Form.Item
        name="totalSeats"
        label="Tổng ghế"
        rules={[{ required: true, message: "Nhập tổng ghế" }]}
      >
        <Select<number> placeholder="Chọn tổng ghế" disabled={isEditing}>
          <Select.Option value={30}>30</Select.Option>
          <Select.Option value={40}>40</Select.Option>
          <Select.Option value={50}>50</Select.Option>
          <Select.Option value={60}>60</Select.Option>
        </Select>
      </Form.Item>
    </Form>
  </Modal>
);

export default ShowtimeFormModal;
