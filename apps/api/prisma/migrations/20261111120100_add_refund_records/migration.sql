ALTER TABLE "orders" ADD COLUMN "paid_ingredient_deductions" JSONB;
ALTER TABLE "refund_requests"
  ADD COLUMN "payment_id" TEXT,
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "message" TEXT,
  ADD COLUMN "completed_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "refund_requests_payment_id_key" ON "refund_requests"("payment_id");
CREATE TABLE "refund_attempts" (
  "id" TEXT NOT NULL,
  "refund_id" TEXT NOT NULL,
  "status" "RefundRequestStatus" NOT NULL DEFAULT 'PROCESSING',
  "processed_by" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "gateway_code" TEXT,
  "gateway_reference" TEXT,
  "message" TEXT,
  "evidence" TEXT,
  CONSTRAINT "refund_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refund_attempts_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refund_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "refund_attempts_refund_id_started_at_idx" ON "refund_attempts"("refund_id", "started_at");
