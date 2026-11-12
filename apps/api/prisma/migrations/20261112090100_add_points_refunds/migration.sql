-- Historical cash refunds must never be relabelled as a points credit.
ALTER TABLE "refund_requests"
  ADD COLUMN "refund_method" TEXT NOT NULL DEFAULT 'CASH',
  ADD COLUMN "refund_points" INTEGER,
  ADD COLUMN "vnd_per_point" INTEGER;
ALTER TABLE "refund_requests" ALTER COLUMN "refund_method" SET DEFAULT 'POINTS';
-- Only untouched requests may adopt the new policy automatically.
UPDATE "refund_requests" AS r SET
  "refund_method" = 'POINTS', "refund_points" = CEIL(r."amount" / 1000)::INTEGER,
  "vnd_per_point" = 1000,
  "message" = 'Đang chờ nhân viên duyệt hoàn bằng điểm (1 điểm = 1.000đ, làm tròn lên).'
WHERE r."status" = 'PENDING' AND NOT EXISTS (
  SELECT 1 FROM "refund_attempts" a WHERE a."refund_id" = r."id"
);
CREATE UNIQUE INDEX "loyalty_transactions_refund_credit_order_key"
  ON "loyalty_transactions"("order_id") WHERE "type" = 'REFUND_CREDIT' AND "order_id" IS NOT NULL;
