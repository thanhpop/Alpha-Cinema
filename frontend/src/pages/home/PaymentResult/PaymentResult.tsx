import { useMemo, useEffect, useState, useRef, type JSX } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Result, Button, message, Typography } from "antd";
import { paymentService } from "@/services/paymentService";
import { reservationService } from "@/services/reservationService";

const { Text } = Typography;

export default function PaymentResult(): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const didConfirmRef = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);

  const qp = useMemo(() => {
    const p = new URLSearchParams(location.search);
    const get = (k: string) => p.get(k) ?? undefined;

    const txnRef = get("vnp_TxnRef") ?? get("vnp_TrxRef") ?? "-";
    const responseCode = (get("vnp_ResponseCode") ?? "-").toString();
    const amountRaw = get("vnp_Amount") ?? "0";
    const amountNum = (() => {
      const n = Number(amountRaw);
      return Number.isFinite(n) ? n : 0;
    })();
    const orderInfo = get("vnp_OrderInfo")
      ? decodeURIComponent(get("vnp_OrderInfo") as string)
      : "-";

    const bankCode = get("vnp_BankCode") ?? "-";
    const payDate = get("vnp_PayDate") ?? "-";
    const txnNo = get("vnp_TransactionNo") ?? "-";
    const txnStatus = get("vnp_TransactionStatus") ?? "-";
    const secureHash = get("vnp_SecureHash") ?? "-";

    return {
      txnRef,
      responseCode,
      amountNum,
      orderInfo,
      bankCode,
      payDate,
      txnNo,
      txnStatus,
      secureHash,
      rawSearch: location.search,
    };
  }, [location.search]);

  const success = qp.responseCode === "00";

  useEffect(() => {
    if (didConfirmRef.current) return;
    didConfirmRef.current = true;

    const handleResult = async () => {
      try {
        if (success) {
          await paymentService.confirmReservation(qp.txnRef);
        } else {
          await reservationService.cancelReservation(qp.txnRef);
        }
      } catch (err: any) {
        console.error(err);
        message.error(
          err?.response?.data?.message || "Có lỗi xảy ra khi xử lý giao dịch",
        );
      }
    };

    handleResult();
  }, [success, qp.txnRef]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate("/");
      return;
    }
    const t = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [secondsLeft]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f5f7fb",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 40,
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
          maxWidth: 560,
          width: "100%",
        }}
      >
        <Result
          status={success ? "success" : "error"}
          title={
            <span style={{ fontSize: 24, fontWeight: 600 }}>
              {success ? "Thanh toán thành công" : "Thanh toán thất bại"}
            </span>
          }
          subTitle={
            <span style={{ fontSize: 17 }}>
              {success
                ? `Giao dịch ${qp.txnRef} đã được xử lý thành công.`
                : `Giao dịch ${qp.txnRef} không thành công (mã: ${qp.responseCode}).`}
            </span>
          }
          extra={[
            <Button
              key="home"
              type="primary"
              size="large"
              style={{ fontSize: 15, height: 46, padding: "0 28px" }}
              onClick={() => navigate("/")}
            >
              Về trang chủ
            </Button>,
          ]}
        />

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Trang sẽ tự động chuyển về trang chủ sau{" "}
            <Text strong style={{ fontSize: 16 }}>
              {secondsLeft}
            </Text>{" "}
            giây.
          </Text>
        </div>
      </div>
    </div>
  );
}
