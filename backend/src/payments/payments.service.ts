import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async process(userId: string, idempotencyKey: string, dto: CreatePaymentDto) {
    const replay = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (replay) return this.toResponse(replay);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({
          where: { id: dto.orderId, userId },
          include: { items: true },
        });
        if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');
        if (!['PENDING', 'PAYMENT_FAILED'].includes(order.status)) {
          throw new BadRequestException('Đơn hàng không thể thanh toán ở trạng thái hiện tại.');
        }

        const attempt = (await tx.payment.count({ where: { orderId: order.id } })) + 1;
        if (attempt > 3) {
          throw new ConflictException('Đơn hàng đã vượt quá số lần thanh toán cho phép.');
        }

        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            attemptNumber: attempt,
            paymentMethod: dto.paymentMethod,
            amount: order.totalAmount,
            idempotencyKey,
            status: PaymentStatus.PENDING,
          },
        });

        for (const item of order.items) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity }, version: { increment: 1 } },
          });
          if (updated.count !== 1) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: PaymentStatus.FAILED },
            });
            await tx.order.update({
              where: { id: order.id },
              data: { status: 'PAYMENT_FAILED' },
            });
            throw new ConflictException('Sản phẩm không đủ tồn kho để thanh toán.');
          }
        }

        const completed = await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.SUCCESS },
        });
        if (order.voucherCode) {
          const voucher = await tx.voucher.findUnique({
            where: { code: order.voucherCode },
          });
          if (voucher && (voucher.usageLimit === null || voucher.usedCount < voucher.usageLimit)) {
            await tx.voucher.update({
              where: { id: voucher.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        }
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        });
        return this.toResponse(completed);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const duplicate = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
        });
        if (duplicate) return this.toResponse(duplicate);
      }
      throw error;
    }
  }

  private toResponse(payment: {
    id: string;
    orderId: string;
    attemptNumber: number;
    paymentMethod: string;
    amount: Prisma.Decimal;
    status: string;
  }) {
    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      attemptNumber: payment.attemptNumber,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount.toFixed(2),
      status: payment.status,
    };
  }
}
