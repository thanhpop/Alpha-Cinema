import { Modal, Form, Row, Col, Input, Tag, Button } from "antd";
import type { FormInstance } from "antd";

interface MovieViewModalProps {
  open: boolean;
  viewForm: FormInstance;
  onClose: () => void;
}

const MovieViewModal: React.FC<MovieViewModalProps> = ({
  open,
  viewForm,
  onClose,
}) => (
  <Modal
    title="Chi tiết Phim"
    open={open}
    onCancel={onClose}
    width={900}
    footer={[
      <Button key="close" onClick={onClose}>
        Đóng
      </Button>,
    ]}
  >
    <Form form={viewForm} layout="vertical">
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item shouldUpdate noStyle>
            {() => {
              const src = viewForm.getFieldValue("poster");
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
          <div style={{ marginTop: 16 }} />
          <Form.Item label="Poster">
            <Input readOnly value={viewForm.getFieldValue("poster") || ""} />
          </Form.Item>
        </Col>
        <Col span={16}>
          <Form.Item label="Tên phim">
            <Input readOnly value={viewForm.getFieldValue("title") || ""} />
          </Form.Item>

          <Form.Item label="Mô tả">
            <Input.TextArea
              rows={4}
              readOnly
              value={viewForm.getFieldValue("overview") || ""}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Thời lượng (phút)">
                <Input
                  readOnly
                  value={(() => {
                    const v = viewForm.getFieldValue("duration");
                    return v !== undefined && v !== null ? String(v) : "";
                  })()}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngôn ngữ">
                <Input
                  readOnly
                  value={viewForm.getFieldValue("language") || ""}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Thể loại">
            <div>
              {Array.isArray(viewForm.getFieldValue("genres")) &&
                viewForm.getFieldValue("genres").length > 0 &&
                (viewForm.getFieldValue("genres") as string[]).map((g) => (
                  <Tag key={g}>{g}</Tag>
                ))}
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ngày khởi chiếu">
                <Input
                  readOnly
                  value={viewForm.getFieldValue("releaseDate") || ""}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày kết thúc">
                <Input
                  readOnly
                  placeholder="Chưa xác định"
                  value={viewForm.getFieldValue("endDate") || ""}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="IMDB ID">
                <Input
                  readOnly
                  value={viewForm.getFieldValue("imdbId") || "N/A"}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Film ID">
                <Input
                  readOnly
                  value={viewForm.getFieldValue("filmId") || "N/A"}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Trailer">
            <Input readOnly value={viewForm.getFieldValue("trailer") || ""} />
          </Form.Item>

          {viewForm.getFieldValue("trailer") && (
            <div style={{ marginTop: 12 }}>
              <iframe
                width="100%"
                height="315"
                src={viewForm
                  .getFieldValue("trailer")
                  .replace("watch?v=", "embed/")}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 8 }}
              />
            </div>
          )}
        </Col>
      </Row>
    </Form>
  </Modal>
);

export default MovieViewModal;
