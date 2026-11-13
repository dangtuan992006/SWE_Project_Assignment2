"use client";
import { useState } from "react";
import type { RefundRequestInfo } from "@/types/brewlite";
import { apiClient } from "@/utils/apiClient";
import RefundStatus from "./RefundStatus";

export default function RefundStaffActions({
  orderId,
  refund,
  onChanged,
}: {
  orderId: string;
  refund: RefundRequestInfo;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [outcome, setOutcome] = useState<"SUCCEEDED" | "FAILED">("SUCCEEDED");
  async function submit(action: string, body?: unknown) {
    if (busy) return;
    if (
      action === "approve-refund" &&
      !window.confirm(
        `Hủy đơn và hoàn ${refund.refundPoints ?? Math.ceil(Number(refund.amount) / 1000)} điểm vào tài khoản khách? Không hoàn tiền qua VNPay/ngân hàng; điểm thưởng từ đơn được thu hồi riêng.`,
      )
    )
      return;
    if (
      action === "resolve-refund" &&
      !window.confirm(
        "Bạn đã kiểm tra chứng từ trên VNPay/ngân hàng và xác nhận kết quả này? Không dùng trạng thái thanh toán gốc để kết luận hoàn tiền.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await apiClient.post(`/orders/${orderId}/${action}`, body);
      await onChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể xử lý yêu cầu. Hãy tải lại để kiểm tra trạng thái.",
      );
    } finally {
      setBusy(false);
    }
  }
  const buttonClass =
    "mt-3 w-full rounded-lg bg-amber-800 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800 disabled:opacity-50";
  return (
    <section aria-label="Xử lý yêu cầu hoàn">
      <RefundStatus refund={refund} />
      {error && (
        <p role="alert" className="mt-2 break-words text-sm text-red-700">
          {error}
        </p>
      )}
      {["PENDING", "FAILED"].includes(refund.status) && (
        <button
          type="button"
          disabled={busy}
          className={buttonClass}
          onClick={() => submit("approve-refund")}
        >
          {busy
            ? "Đang xử lý…"
            : refund.status === "FAILED"
              ? "Hoàn bằng điểm"
              : "Duyệt và hoàn điểm"}
        </button>
      )}
      {refund.status === "PENDING" && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-amber-900">
            Từ chối yêu cầu
          </summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit("reject-refund", { reason: reason.trim() });
            }}
          >
            <label className="mt-3 block">
              Lý do từ chối
              <textarea
                required
                minLength={5}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-400 p-2"
              />
            </label>
            <button
              disabled={busy || reason.trim().length < 5}
              className={buttonClass}
            >
              Ghi nhận từ chối
            </button>
          </form>
        </details>
      )}
      {refund.refundMethod === "CASH" &&
        ["PROCESSING", "UNKNOWN"].includes(refund.status) && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold text-amber-900">
              Ghi nhận kết quả đối soát
            </summary>
            <p className="mt-2">
              Chỉ dùng sau khi xác minh kết quả hoàn tiền với VNPay/ngân hàng,
              ít nhất 60 giây sau khi gửi yêu cầu.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit("resolve-refund", {
                  status: outcome,
                  evidence: evidence.trim(),
                });
              }}
            >
              <label className="mt-3 block">
                Kết quả đã xác minh
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as typeof outcome)}
                  className="mt-1 w-full rounded-lg border border-stone-400 p-2"
                >
                  <option value="SUCCEEDED">Hoàn tiền thành công</option>
                  <option value="FAILED">
                    Hoàn tiền cũ thất bại, được phép hoàn điểm
                  </option>
                </select>
              </label>
              <label className="mt-3 block">
                Mã chứng từ và nội dung xác minh
                <textarea
                  required
                  minLength={12}
                  maxLength={1000}
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-400 p-2"
                />
              </label>
              <p className="mt-1 text-xs">
                Không nhập thông tin thẻ, OTP hoặc khóa bí mật.
              </p>
              <button
                disabled={busy || evidence.trim().length < 12}
                className={buttonClass}
              >
                Lưu kết quả đối soát
              </button>
            </form>
          </details>
        )}
    </section>
  );
}
