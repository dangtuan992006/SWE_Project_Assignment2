import { Prisma } from '@prisma/client';

export const REFUND_VND_PER_POINT = 1000;

// Decimal arithmetic avoids floating point rounding at conversion boundaries.
export function calculateRefundPoints(
  amount: Prisma.Decimal.Value,
  vndPerPoint = REFUND_VND_PER_POINT,
): number {
  const value = new Prisma.Decimal(amount);
  if (
    !value.isFinite() ||
    value.lte(0) ||
    !Number.isSafeInteger(vndPerPoint) ||
    vndPerPoint <= 0
  ) {
    throw new RangeError('Số tiền hoặc tỷ lệ hoàn điểm không hợp lệ.');
  }
  const points = value.div(vndPerPoint).ceil().toNumber();
  if (!Number.isSafeInteger(points) || points > 2147483647)
    throw new RangeError('Số điểm hoàn vượt giới hạn lưu trữ.');
  return points;
}
