import type { RefundRequestInfo } from "@/types/brewlite";

export default function RefundStatus({
  refund,
}: {
  refund: RefundRequestInfo;
}) {
  const points = refund.refundMethod === "POINTS";
  const labels: Record<RefundRequestInfo["status"], string> = {
    PENDING: points
      ? "Yêu cầu hoàn điểm đang chờ duyệt"
      : "Yêu cầu hoàn cũ đang chờ xử lý",
    PROCESSING: "Lượt hoàn tiền cũ đang xử lý",
    UNKNOWN: "Lượt hoàn tiền cũ cần đối soát",
    SUCCEEDED: points ? "Đã hoàn điểm" : "Đã hoàn tiền",
    FAILED: "Yêu cầu hoàn chưa thành công",
    REJECTED: "Yêu cầu hoàn bị từ chối",
    APPROVED: "Yêu cầu cũ đã duyệt, cần xác minh",
  };
  return (
    <div
      role="status"
      className={`mt-3 rounded-xl border p-4 text-sm ${refund.status === "SUCCEEDED" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
    >
      <p className="font-semibold">{labels[refund.status]}</p>
      {points && (
        <p className="mt-1 text-base font-semibold tabular-nums">
          {refund.status === "SUCCEEDED" ? "Điểm đã hoàn" : "Điểm dự kiến hoàn"}
          : {(refund.refundPoints ?? 0).toLocaleString("vi-VN")} điểm
        </p>
      )}
      <p className="mt-1 tabular-nums">
        {points ? "Số tiền quy đổi" : "Số tiền"}:{" "}
        {Number(refund.amount).toLocaleString("vi-VN")} ₫
      </p>
      {points && (
        <>
          <p className="mt-1">
            1 điểm = {(refund.vndPerPoint ?? 1000).toLocaleString("vi-VN")}đ;
            phần lẻ làm tròn lên. Không hoàn qua VNPay/ngân hàng.
          </p>
          <p className="mt-1">
            Điểm dùng để đổi voucher trong Tài khoản. Điểm thưởng đã nhận từ đơn
            được thu hồi riêng.
          </p>
        </>
      )}
      {!points && refund.provider === "MOCK" && (
        <p className="mt-1">Hoàn tiền giả lập cũ, không có chuyển tiền thật.</p>
      )}
      {refund.message && <p className="mt-2 break-words">{refund.message}</p>}
      {refund.reason && (
        <p className="mt-1 break-words">Lý do: {refund.reason}</p>
      )}
      {["PROCESSING", "UNKNOWN", "APPROVED"].includes(refund.status) && (
        <p className="mt-2">
          Chưa xác nhận tiền đã về. Cần đối soát lượt cũ trước khi cộng điểm để
          tránh hoàn hai lần.
        </p>
      )}
    </div>
  );
}
