import { Modal, Descriptions, Tag, Space } from "antd";
import type { ReservationResponse } from "@/services/reservationService";

interface ReservationDetailModalProps {
  open: boolean;
  reservation: ReservationResponse | null;
  onClose: () => void;
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  open,
  reservation,
  onClose,
}) => (
  <Modal
    title="Chi tiết đơn đặt vé"
    open={open}
    onCancel={onClose}
    footer={null}
    width={600}
  >
    {reservation && (
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="ID đơn">{reservation.id}</Descriptions.Item>

        <Descriptions.Item label="ID người dùng">
          {reservation.userId}
        </Descriptions.Item>

        <Descriptions.Item label="ID suất chiếu">
          {reservation.showtimeId}
        </Descriptions.Item>

        <Descriptions.Item label="Thời gian đặt">
          {reservation.reservationTime}
        </Descriptions.Item>

        <Descriptions.Item label="Suất chiếu">
          {reservation.showDateTimeText ?? "-"}
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái">
          <Tag
            color={
              reservation.statusValue === "CONFIRMED"
                ? "green"
                : reservation.statusValue === "PENDING"
                  ? "orange"
                  : "red"
            }
          >
            {reservation.statusValue}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Tổng tiền">
          {reservation.totalPrice.toLocaleString("vi-VN")} đ
        </Descriptions.Item>

        <Descriptions.Item label="Thanh toán">
          {reservation.paid ? (
            <Tag color="green">Đã thanh toán</Tag>
          ) : (
            <Tag color="red">Chưa thanh toán</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Ghế đã đặt">
          {reservation.seats?.length ? (
            <Space wrap>
              {reservation.seats.map((seat) => (
                <Tag key={seat.id} color={seat.isReserved ? "blue" : "default"}>
                  {seat.seatNumber}
                </Tag>
              ))}
            </Space>
          ) : (
            <Tag color="default">Không có ghế</Tag>
          )}
        </Descriptions.Item>
      </Descriptions>
    )}
  </Modal>
);

export default ReservationDetailModal;
