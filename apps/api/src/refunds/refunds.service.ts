import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  RefundRequestStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { calculateRefundPoints, REFUND_VND_PER_POINT } from './refund-points';

// Kept only to settle cash requests already sent before the points policy.
type RefundOutcome = {
  status: 'SUCCEEDED' | 'FAILED';
  message: string;
  code?: string;
  reference?: string;
};

const ACTIVE = ['PENDING', 'PROCESSING', 'UNKNOWN', 'APPROVED'];

@Injectable()
export class RefundsService {
  constructor(private readonly prisma: PrismaService) {}

  async request(userId: string, orderId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "orders" WHERE "id" = ${orderId} FOR UPDATE`;
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
      });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');
      if (order.status !== OrderStatus.PAID)
        throw new ConflictException(
          'Chỉ yêu cầu hoàn tiền cho đơn đã thanh toán và chưa pha chế.',
        );
      const existing = await tx.refundRequest.findUnique({
        where: { orderId },
      });
      if (existing && existing.status !== 'REJECTED') return existing;
      const payments = await tx.payment.findMany({
        where: { orderId, status: PaymentStatus.SUCCESS },
      });
      if (
        payments.length !== 1 ||
        payments[0].amount.lte(0) ||
        !payments[0].amount.isInteger() ||
        !payments[0].amount.equals(order.totalAmount) ||
        payments[0].errorCode
      )
        throw new ConflictException(
          'Giao dịch thu tiền cần được đối soát trước khi hoàn.',
        );
      const payment = payments[0];
      const data = {
        userId,
        paymentId: payment.id,
        provider: payment.provider,
        amount: payment.amount,
        refundMethod: 'POINTS',
        refundPoints: calculateRefundPoints(payment.amount),
        vndPerPoint: REFUND_VND_PER_POINT,
        reason: reason?.trim() || 'Khách hàng hủy đơn trước khi pha chế',
        status: RefundRequestStatus.PENDING,
        processedBy: null,
        processedAt: null,
        message:
          'Đang chờ nhân viên duyệt hoàn bằng điểm (1 điểm = 1.000đ, làm tròn lên).',
      };
      return tx.refundRequest.upsert({
        where: { orderId },
        create: { ...data, orderId },
        update: data,
      });
    });
  }

  async approve(orderId: string, staff: string) {
    // Credit, cancellation, stock reversal and audit are atomic. There is no network call.
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "orders" WHERE "id" = ${orderId} FOR UPDATE`;
      const order = await tx.order.findUnique({ where: { id: orderId } });
      const refund = await tx.refundRequest.findUnique({ where: { orderId } });
      if (!order || !refund)
        throw new NotFoundException('Không tìm thấy yêu cầu hoàn điểm.');
      if (refund.status === 'SUCCEEDED') return refund;
      if (['PROCESSING', 'UNKNOWN', 'APPROVED'].includes(refund.status)) {
        throw new ConflictException(
          'Lượt hoàn tiền cũ chưa xác định kết quả. Phải đối soát trước khi hoàn điểm để tránh hoàn hai lần.',
        );
      }
      if (!['PENDING', 'FAILED'].includes(refund.status))
        throw new ConflictException('Yêu cầu này không thể được duyệt.');
      const legacyFailed =
        refund.refundMethod === 'CASH' &&
        refund.status === 'FAILED' &&
        order.status === 'CANCELLED';
      if (!legacyFailed && order.status !== 'PAID')
        throw new ConflictException(
          'Chỉ hoàn điểm cho đơn đã thanh toán và chưa pha chế.',
        );
      const unsafeAttempt = await tx.refundAttempt.findFirst({
        where: {
          refundId: refund.id,
          status: { in: ['PROCESSING', 'UNKNOWN', 'SUCCEEDED', 'APPROVED'] },
        },
      });
      if (unsafeAttempt)
        throw new ConflictException(
          'Đã có lượt hoàn cần kiểm tra. Không được cộng điểm trùng.',
        );
      const payments = await tx.payment.findMany({
        where: { orderId, status: PaymentStatus.SUCCESS },
      });
      const payment = payments[0];
      if (
        payments.length !== 1 ||
        !payment ||
        payment.amount.lte(0) ||
        !payment.amount.isInteger() ||
        !payment.amount.equals(order.totalAmount) ||
        !payment.amount.equals(refund.amount) ||
        payment.errorCode ||
        (refund.paymentId && refund.paymentId !== payment.id)
      )
        throw new ConflictException('Giao dịch không khớp yêu cầu hoàn điểm.');
      const rate =
        refund.refundMethod === 'POINTS'
          ? (refund.vndPerPoint ?? REFUND_VND_PER_POINT)
          : REFUND_VND_PER_POINT;
      const credit = calculateRefundPoints(payment.amount, rate);
      if (
        refund.refundMethod === 'POINTS' &&
        refund.refundPoints !== null &&
        refund.refundPoints !== credit
      )
        throw new ConflictException('Số điểm hoàn không khớp tỷ lệ đã lưu.');
      const now = new Date();
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      await this.restore(tx, orderId, payment.id, credit);
      const message = `Đã hoàn ${credit} điểm vào tài khoản. Không hoàn tiền qua VNPay/ngân hàng.`;
      await tx.refundAttempt.create({
        data: {
          refundId: refund.id,
          status: 'SUCCEEDED',
          processedBy: staff,
          startedAt: now,
          completedAt: now,
          gatewayCode: 'POINTS',
          message,
        },
      });
      return tx.refundRequest.update({
        where: { id: refund.id },
        data: {
          status: 'SUCCEEDED',
          refundMethod: 'POINTS',
          refundPoints: credit,
          vndPerPoint: rate,
          paymentId: payment.id,
          provider: payment.provider,
          processedBy: staff,
          processedAt: now,
          completedAt: now,
          message,
        },
      });
    });
  }

  async reject(orderId: string, staff: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "orders" WHERE "id" = ${orderId} FOR UPDATE`;
      const refund = await tx.refundRequest.findUnique({ where: { orderId } });
      if (!refund)
        throw new NotFoundException('Không tìm thấy yêu cầu hoàn tiền.');
      if (refund.status !== 'PENDING')
        throw new ConflictException('Chỉ từ chối yêu cầu đang chờ duyệt.');
      return tx.refundRequest.update({
        where: { id: refund.id },
        data: {
          status: 'REJECTED',
          processedBy: staff,
          processedAt: new Date(),
          message: reason,
        },
      });
    });
  }

  async resolve(
    orderId: string,
    staff: string,
    status: 'SUCCEEDED' | 'FAILED',
    evidence: string,
  ) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { orderId },
      include: { attempts: { orderBy: { startedAt: 'desc' }, take: 1 } },
    });
    if (!refund || !refund.attempts[0])
      throw new NotFoundException(
        'Không tìm thấy lượt hoàn tiền cần đối soát.',
      );
    if (
      refund.refundMethod !== 'CASH' ||
      !['PROCESSING', 'UNKNOWN'].includes(refund.status)
    )
      throw new ConflictException('Yêu cầu không ở trạng thái cần đối soát.');
    const attempt = refund.attempts[0];
    if (Date.now() - attempt.startedAt.getTime() < 60000)
      throw new ConflictException(
        'Vui lòng đợi ít nhất 60 giây trước khi ghi nhận đối soát thủ công.',
      );
    return this.finish(
      orderId,
      attempt.id,
      { status, message: 'Kết quả được nhân viên xác nhận sau khi đối soát.' },
      `${staff}: ${evidence}`,
    );
  }

  private async finish(
    orderId: string,
    attemptId: string,
    outcome: RefundOutcome,
    evidence?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "orders" WHERE "id" = ${orderId} FOR UPDATE`;
      const refund = await tx.refundRequest.findUnique({ where: { orderId } });
      const attempt = await tx.refundAttempt.findUnique({
        where: { id: attemptId },
      });
      if (!refund || !attempt || attempt.refundId !== refund.id)
        throw new ConflictException('Lượt hoàn tiền không khớp.');
      // Late network results cannot override a later manual resolution or retry.
      if (
        !['PROCESSING', 'UNKNOWN'].includes(refund.status) ||
        !['PROCESSING', 'UNKNOWN'].includes(attempt.status)
      )
        return refund;
      if (outcome.status === 'SUCCEEDED')
        await this.restore(tx, orderId, refund.paymentId!);
      const completedAt = ['SUCCEEDED', 'FAILED'].includes(outcome.status)
        ? new Date()
        : null;
      await tx.refundAttempt.update({
        where: { id: attemptId },
        data: {
          status: outcome.status,
          completedAt,
          gatewayCode: outcome.code,
          gatewayReference: outcome.reference,
          message: outcome.message,
          evidence,
        },
      });
      return tx.refundRequest.update({
        where: { id: refund.id },
        data: { status: outcome.status, message: outcome.message, completedAt },
      });
    });
  }

  private async restore(
    tx: Prisma.TransactionClient,
    orderId: string,
    paymentId: string,
    pointsToCredit?: number,
  ) {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
    });
    if (
      order.status !== 'CANCELLED' ||
      payment.orderId !== orderId ||
      payment.status !== 'SUCCESS'
    )
      throw new ConflictException(
        'Không thể ghi nhận hoàn tiền cho giao dịch hiện tại.',
      );
    if (order.voucherCode) {
      await tx.voucher.updateMany({
        where: { code: order.voucherCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }
    // Exact product quantities are immutable order snapshots, not current cart data.
    const quantities = new Map<string, number>();
    for (const item of order.items)
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    for (const [id, quantity] of [...quantities].sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      await tx.product.update({
        where: { id },
        data: { stock: { increment: quantity }, version: { increment: 1 } },
      });
    }
    // Only restore recorded ingredient deductions. Never reconstruct with recipes that may have changed.
    if (Array.isArray(order.paidIngredientDeductions)) {
      for (const raw of order.paidIngredientDeductions) {
        const item = raw as { ingredientId: string; amount: string };
        const amount = new Prisma.Decimal(item.amount);
        if (!amount.gt(0))
          throw new ConflictException(
            'Snapshot nguyên liệu không hợp lệ. Cần kiểm kê.',
          );
        const ingredient = await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: { stock: { increment: amount } },
        });
        await tx.ingredientAuditLog.create({
          data: {
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            action: 'ORDER_REFUND',
            changeAmount: amount,
            previousStock: ingredient.stock.minus(amount),
            newStock: ingredient.stock,
            unit: ingredient.unit,
            reason: `Hoàn tiền đơn ${orderId}`,
            performedBy: 'Hệ thống hoàn tiền',
          },
        });
      }
    }
    const earned = await tx.loyaltyTransaction.aggregate({
      where: { orderId, userId: order.userId, type: TransactionType.EARN },
      _sum: { points: true },
    });
    const points = earned._sum.points ?? 0;
    if (points > 0) {
      // An already-spent reward becomes a debt, rather than awarding free points after refund.
      await tx.user.update({
        where: { id: order.userId },
        data: { loyaltyPoints: { decrement: points } },
      });
      await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          orderId,
          type: TransactionType.REFUND,
          points: -points,
        },
      });
    }
    if (pointsToCredit !== undefined) {
      const updated = await tx.user.updateMany({
        where: {
          id: order.userId,
          loyaltyPoints: { lte: 2147483647 - pointsToCredit },
        },
        data: { loyaltyPoints: { increment: pointsToCredit } },
      });
      if (updated.count !== 1)
        throw new ConflictException(
          'Số dư điểm vượt giới hạn; chưa ghi nhận hoàn điểm.',
        );
      await tx.loyaltyTransaction.create({
        data: {
          userId: order.userId,
          orderId,
          type: TransactionType.REFUND_CREDIT,
          points: pointsToCredit,
        },
      });
      // Money was captured successfully and was NOT refunded by the payment gateway.
      // Keep Payment.SUCCESS/refundedAt untouched; RefundRequest records the points settlement.
    } else {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
      });
    }
  }
}

export { ACTIVE as ACTIVE_REFUND_STATUSES };
