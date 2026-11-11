-- CreateEnum
CREATE TYPE "IngredientLogAction" AS ENUM ('CREATE', 'RESTOCK', 'UPDATE', 'DELETE', 'ORDER_DEDUCT');

-- CreateTable
CREATE TABLE "ingredient_audit_logs" (
    "id" TEXT NOT NULL,
    "ingredient_id" TEXT,
    "ingredient_name" TEXT NOT NULL,
    "action" "IngredientLogAction" NOT NULL,
    "change_amount" DECIMAL(10,2),
    "previous_stock" DECIMAL(10,2),
    "new_stock" DECIMAL(10,2),
    "unit" TEXT NOT NULL,
    "reason" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ingredient_audit_logs_created_at_idx" ON "ingredient_audit_logs"("created_at");
