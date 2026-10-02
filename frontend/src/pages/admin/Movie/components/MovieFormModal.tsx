import {
  Modal,
  Form,
  Row,
  Col,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
} from "antd";
import type { FormInstance } from "antd";

const { Option } = Select;

interface MovieFormModalProps {
  open: boolean;
  isEditing: boolean;
  form: FormInstance;
  onOk: () => void;
  onCancel: () => void;
  onOpenApiSearch: () => void;
}

const MovieFormModal: React.FC<MovieFormModalProps> = ({
  open,
  isEditing,
  form,
  onOk,
  onCancel,
  onOpenApiSearch,
}) => (
  <Modal
    title={isEditing ? "Sửa Phim" : "Thêm Phim mới"}
    open={open}
    onCancel={onCancel}
    width={900}
    okText={isEditing ? "Lưu" : "Thêm"}
    onOk={onOk}
  >
    <Form form={form} layout="vertical">
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item shouldUpdate noStyle>
            {() => {
              const src = form.getFieldValue("poster");
              return (
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "2 / 3",
                    background: "#f5f5f5",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={src}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              );
            }}
          </Form.Item>
          <div style={{ marginTop: 56 }} />
          <Form.Item label="Poster (URL)" name="poster">
            <Input placeholder="URL ảnh poster " />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item>
            <Button type="primary" block onClick={onOpenApiSearch}>
              Tìm phim từ API
            </Button>
          </Form.Item>

          <Form.Item
            label="Tên phim"
            name="title"
            rules={[{ required: true, message: "Vui lòng nhập tên phim" }]}
          >
            <Input placeholder="Nhập tên phim" />
          </Form.Item>
          <Form.Item
            label="Mô tả"
            name="overview"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                label="Thời lượng (phút)"
                name="duration"
                rules={[
                  { required: true, message: "Vui lòng nhập thời lượng" },
                ]}
              >
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Ngôn ngữ"
                name="language"
                rules={[{ required: true, message: "Vui lòng nhập ngôn ngữ" }]}
              >
                <Select placeholder="Chọn ngôn ngữ">
                  <Option value="Tiếng Anh">Tiếng Anh</Option>
                  <Option value="Tiếng Việt">Tiếng Việt</Option>
                  <Option value="Tiếng Nhật">Tiếng Nhật</Option>
                  <Option value="Tiếng Hàn">Tiếng Hàn</Option>
                  <Option value="Tiếng Trung">Tiếng Trung</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Thể loại"
            name="genres"
            rules={[{ required: true, message: "Vui lòng nhập thể loại" }]}
          >
            <Select
              mode="tags"
              style={{ width: "100%" }}
              placeholder="Thêm hoặc chọn thể loại"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Ngày khởi chiếu"
                name="releaseDate"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ngày khởi chiếu",
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày kết thúc" name="endDate">
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  placeholder="Không bắt buộc"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="IMDB ID" name="imdbId">
                <Input placeholder="Ví dụ: tt15398776" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="TMDB Film ID" name="filmId">
                <Input placeholder="Ví dụ: 872585" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Trailer (YouTube URL)"
            name="trailer"
            rules={[
              {
                type: "url",
                message: "Trailer phải là URL hợp lệ",
              },
            ]}
          >
            <Input placeholder="https://www.youtube.com/watch?v=..." />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </Modal>
);

export default MovieFormModal;
