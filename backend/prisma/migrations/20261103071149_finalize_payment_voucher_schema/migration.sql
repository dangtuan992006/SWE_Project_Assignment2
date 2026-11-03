/*
  Warnings:

  - You are about to drop the column `method` on the `payments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[order_id,attempt_number]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `payment_method` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `discount_type` on the `vouchers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');

-- DropIndex
DROP INDEX "payments_order_id_key";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "method",
ADD COLUMN     "attempt_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL;

-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "max_discount" DECIMAL(10,2),
ADD COLUMN     "min_order_value" DECIMAL(10,2),
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "usage_limit" INTEGER,
ADD COLUMN     "used_count" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "discount_type",
ADD COLUMN     "discount_type" "DiscountType" NOT NULL;

-- DropEnum
DROP TYPE "VoucherType";

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_attempt_number_key" ON "payments"("order_id", "attempt_number");
