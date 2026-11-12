import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';

describe('Hoàn bằng điểm E2E trên PostgreSQL thật, không gọi gateway', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customer: string, other: string, admin: string, barista: string;
  let customerId: string;
  const userIds: string[] = [],
    orderIds: string[] = [],
    productIds: string[] = [],
    ingredientIds: string[] = [],
    categoryIds: string[] = [],
    voucherCodes: string[] = [];
  let fetchSpy: jest.SpyInstance;

  const post = (path: string, token: string, body = {}) =>
    request(app.getHttpServer())
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  const getOrder = (id: string) =>
    request(app.getHttpServer())
      .get(`/orders/${id}`)
      .set('Authorization', `Bearer ${customer}`);
  beforeAll(async () => {
    process.env.PAYMENT_PROVIDER = 'MOCK';
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    const jwt = app.get(JwtService);
    for (const role of ['CUSTOMER', 'CUSTOMER', 'ADMIN', 'BARISTA'] as const) {
      const id = randomUUID();
      userIds.push(id);
      const email = `refund-${id}@example.com`;
      await prisma.user.create({
        data: { id, email, passwordHash: 'unused-test-password-hash', role },
      });
    }
    [customer, other, admin, barista] = userIds.map((id, i) =>
      jwt.sign({
        sub: id,
        email: `refund-${id}@example.com`,
        role: ['CUSTOMER', 'CUSTOMER', 'ADMIN', 'BARISTA'][i],
      }),
    );
    customerId = userIds[0];
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('E2E forbids external gateway calls'));
  });
  afterEach(() => {
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    if (prisma) {
      const refunds = await prisma.refundRequest.findMany({
        where: { orderId: { in: orderIds } },
        select: { id: true },
      });
      await prisma.refundAttempt.deleteMany({
        where: { refundId: { in: refunds.map((r) => r.id) } },
      });
      await prisma.refundRequest.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.loyaltyTransaction.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      await prisma.ingredientAuditLog.deleteMany({
        where: { ingredientId: { in: ingredientIds } },
      });
      await prisma.product.deleteMany({ where: { id: { in: productIds } } });
      await prisma.ingredient.deleteMany({
        where: { id: { in: ingredientIds } },
      });
      await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
      await prisma.voucher.deleteMany({
        where: { code: { in: voucherCodes } },
      });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await app?.close();
  });

  async function paid(price = 50000) {
    const categoryId = randomUUID(),
      productId = randomUUID(),
      ingredientId = randomUUID();
    categoryIds.push(categoryId);
    productIds.push(productId);
    ingredientIds.push(ingredientId);
    await prisma.category.create({
      data: { id: categoryId, name: 'Refund test' },
    });
    await prisma.ingredient.create({
      data: {
        id: ingredientId,
        name: `Ingredient ${ingredientId}`,
        unit: 'g',
        stock: 1000,
      },
    });
    await prisma.product.create({
      data: {
        id: productId,
        name: 'Refund coffee',
        categoryId,
        priceS: price,
        priceM: price,
        priceL: price,
        stock: 10,
        recipeItems: { create: { ingredientId, size: 'M', amount: 10 } },
      },
    });
    const code = `RF${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    voucherCodes.push(code);
    await prisma.voucher.create({
      data: {
        code,
        discountType: 'FIXED_AMOUNT',
        discountValue: 10000,
        minOrderValue: 0,
        usageLimit: 100,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000),
      },
    });
    const created = await post('/orders', customer, {
      items: [{ productId, size: 'M', quantity: 2 }],
      voucherCode: code,
    }).expect(201);
    const orderId = created.body.id;
    orderIds.push(orderId);
    await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${customer}`)
      .set('Idempotency-Key', randomUUID())
      .send({ orderId, paymentMethod: 'BANK_CARD' })
      .expect(200);
    const payment = await prisma.payment.findFirstOrThrow({
      where: { orderId },
    });
    return { orderId, productId, ingredientId, payment, code };
  }

  async function balance() {
    return (await prisma.user.findUniqueOrThrow({ where: { id: customerId } }))
      .loyaltyPoints;
  }
  async function creditCount(orderId: string) {
    return prisma.loyaltyTransaction.count({
      where: { orderId, type: 'REFUND_CREDIT' },
    });
  }
  async function cashPending(f: Awaited<ReturnType<typeof paid>>) {
    await post(`/orders/${f.orderId}/cancel`, customer).expect(201);
    const refund = await prisma.refundRequest.update({
      where: { orderId: f.orderId },
      data: {
        refundMethod: 'CASH',
        status: 'UNKNOWN',
        refundPoints: null,
        vndPerPoint: null,
      },
    });
    await prisma.order.update({
      where: { id: f.orderId },
      data: { status: 'CANCELLED' },
    });
    await prisma.refundAttempt.create({
      data: {
        refundId: refund.id,
        status: 'UNKNOWN',
        processedBy: 'legacy-staff',
        startedAt: new Date(Date.now() - 61000),
      },
    });
  }

  it('duyệt -> CANCELLED/SUCCEEDED POINTS; trả kho/voucher, thu hồi thưởng và cộng đúng 90 điểm', async () => {
    const before = await balance();
    const f = await paid();
    expect(await balance()).toBe(before + 9);
    const requested = await post(`/orders/${f.orderId}/cancel`, customer, {
      reason: 'Đặt nhầm món',
    }).expect(201);
    expect(requested.body.order.refundRequest).toMatchObject({
      refundMethod: 'POINTS',
      refundPoints: 90,
      vndPerPoint: 1000,
    });
    await request(app.getHttpServer())
      .patch(`/orders/${f.orderId}/status`)
      .set('Authorization', `Bearer ${barista}`)
      .send({ status: 'PREPARING' })
      .expect(409);
    await prisma.recipeItem.updateMany({
      where: { productId: f.productId },
      data: { amount: 40 },
    });
    const res = await post(
      `/orders/${f.orderId}/approve-refund`,
      barista,
    ).expect(201);
    expect(res.body.refundRequest).toMatchObject({
      status: 'SUCCEEDED',
      refundMethod: 'POINTS',
      refundPoints: 90,
    });
    expect(res.body.order.status).toBe('CANCELLED');
    expect(await balance()).toBe(before + 90);
    await post(`/orders/${f.orderId}/approve-refund`, admin).expect(201);
    expect(await balance()).toBe(before + 90);
    expect(await creditCount(f.orderId)).toBe(1);
    expect(
      await prisma.loyaltyTransaction.count({
        where: { orderId: f.orderId, type: 'REFUND' },
      }),
    ).toBe(1);
    expect(
      await prisma.refundAttempt.count({
        where: { refund: { orderId: f.orderId } },
      }),
    ).toBe(1);
    const payment = await prisma.payment.findUniqueOrThrow({
      where: { id: f.payment.id },
    });
    expect(payment.status).toBe('SUCCESS');
    expect(payment.refundedAt).toBeNull();
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id: f.productId } }))
        .stock,
    ).toBe(10);
    expect(
      (
        await prisma.ingredient.findUniqueOrThrow({
          where: { id: f.ingredientId },
        })
      ).stock.toNumber(),
    ).toBe(1000);
    expect(
      (await prisma.voucher.findUniqueOrThrow({ where: { code: f.code } }))
        .usedCount,
    ).toBe(0);
    expect(
      (await getOrder(f.orderId).expect(200)).body.refundRequest.refundPoints,
    ).toBe(90);
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${customer}`)
      .expect(200);
    expect(me.body.loyaltyPoints ?? me.body.user?.loyaltyPoints).toBe(
      before + 90,
    );
  });

  it('hai lần yêu cầu và duyệt đồng thời chỉ cộng điểm một lần', async () => {
    const before = await balance();
    const f = await paid();
    await Promise.all([
      post(`/orders/${f.orderId}/cancel`, customer).expect(201),
      post(`/orders/${f.orderId}/cancel`, customer).expect(201),
    ]);
    await Promise.all([
      post(`/orders/${f.orderId}/approve-refund`, admin).expect(201),
      post(`/orders/${f.orderId}/approve-refund`, barista).expect(201),
    ]);
    expect(await balance()).toBe(before + 90);
    expect(await creditCount(f.orderId)).toBe(1);
    expect(
      await prisma.refundAttempt.count({
        where: { refund: { orderId: f.orderId } },
      }),
    ).toBe(1);
  });

  it('đơn thanh toán gốc VNPay vẫn hoàn điểm, không cần API refund hoặc khóa merchant', async () => {
    const before = await balance();
    const f = await paid();
    await prisma.payment.update({
      where: { id: f.payment.id },
      data: { provider: 'VNPAY', transactionCode: '123456' },
    });
    await post(`/orders/${f.orderId}/cancel`, customer).expect(201);
    const res = await post(`/orders/${f.orderId}/approve-refund`, admin).expect(
      201,
    );
    expect(res.body.refundRequest).toMatchObject({
      refundMethod: 'POINTS',
      provider: 'VNPAY',
      refundPoints: 90,
    });
    expect(await balance()).toBe(before + 90);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(
      (await prisma.payment.findUniqueOrThrow({ where: { id: f.payment.id } }))
        .status,
    ).toBe(PaymentStatus.SUCCESS);
  });

  it('làm tròn lên theo tiền thực trả: 90.002đ -> 91 điểm', async () => {
    const before = await balance();
    const f = await paid(50001);
    await post(`/orders/${f.orderId}/cancel`, customer).expect(201);
    const res = await post(`/orders/${f.orderId}/approve-refund`, admin).expect(
      201,
    );
    expect(res.body.refundRequest.refundPoints).toBe(91);
    expect(await balance()).toBe(before + 91);
  });

  it('lỗi ghi audit cuối rollback cả điểm/kho/hủy đơn, retry an toàn', async () => {
    const f = await paid();
    await post(`/orders/${f.orderId}/cancel`, customer).expect(201);
    const refund = await prisma.refundRequest.findUniqueOrThrow({
      where: { orderId: f.orderId },
    });
    if (!/^[a-f0-9-]{36}$/.test(refund.id))
      throw new Error('Invalid fixture UUID');
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION points_refund_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.refund_id = '${refund.id}' THEN RAISE EXCEPTION 'points refund test rollback'; END IF; RETURN NEW; END $$`,
    );
    await prisma.$executeRawUnsafe(
      'CREATE TRIGGER points_refund_test_fail_trigger BEFORE INSERT ON refund_attempts FOR EACH ROW EXECUTE FUNCTION points_refund_test_fail()',
    );
    const before = await balance();
    try {
      await post(`/orders/${f.orderId}/approve-refund`, admin).expect(500);
      expect(await balance()).toBe(before);
      expect(await creditCount(f.orderId)).toBe(0);
      expect(
        (
          await prisma.refundRequest.findUniqueOrThrow({
            where: { orderId: f.orderId },
          })
        ).status,
      ).toBe('PENDING');
      expect(
        (await prisma.order.findUniqueOrThrow({ where: { id: f.orderId } }))
          .status,
      ).toBe('PAID');
      expect(
        (await prisma.product.findUniqueOrThrow({ where: { id: f.productId } }))
          .stock,
      ).toBe(8);
      expect(
        (
          await prisma.ingredient.findUniqueOrThrow({
            where: { id: f.ingredientId },
          })
        ).stock.toNumber(),
      ).toBe(980);
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER points_refund_test_fail_trigger ON refund_attempts',
      );
      await prisma.$executeRawUnsafe('DROP FUNCTION points_refund_test_fail()');
    }
    await post(`/orders/${f.orderId}/approve-refund`, admin).expect(201);
    expect(await balance()).toBe(before - 9 + 90);
    expect(await creditCount(f.orderId)).toBe(1);
  });

  it('không vừa cộng điểm vừa hoàn tiền khi CASH cũ UNKNOWN; chỉ chuyển sau đối soát FAILED', async () => {
    const f = await paid();
    await cashPending(f);
    const before = await balance();
    await post(`/orders/${f.orderId}/approve-refund`, admin).expect(409);
    expect(await balance()).toBe(before);
    expect(await creditCount(f.orderId)).toBe(0);
    await post(`/orders/${f.orderId}/resolve-refund`, admin, {
      status: 'FAILED',
      evidence: 'VNPay xác nhận RF-OLD-FAILED-001',
    }).expect(201);
    await post(`/orders/${f.orderId}/approve-refund`, admin).expect(201);
    expect(await balance()).toBe(before - 9 + 90);
    expect(await creditCount(f.orderId)).toBe(1);
  });

  it('CASH cũ đã hoàn thành không cộng điểm khi bấm duyệt lại', async () => {
    const before = await balance();
    const f = await paid();
    await cashPending(f);
    await post(`/orders/${f.orderId}/resolve-refund`, admin, {
      status: 'SUCCEEDED',
      evidence: 'VNPay xác nhận RF-OLD-SUCCESS-001',
    }).expect(201);
    const res = await post(`/orders/${f.orderId}/approve-refund`, admin).expect(
      201,
    );
    expect(res.body.refundRequest.refundMethod).toBe('CASH');
    expect(await creditCount(f.orderId)).toBe(0);
    expect(await balance()).toBe(before);
    expect(
      (await prisma.payment.findUniqueOrThrow({ where: { id: f.payment.id } }))
        .status,
    ).toBe('REFUNDED');
  });

  it('từ chối giữ PAID và cho pha chế, không trừ nguyên liệu lần hai', async () => {
    const f = await paid();
    await post(`/orders/${f.orderId}/cancel`, customer).expect(201);
    await post(`/orders/${f.orderId}/reject-refund`, admin, {
      reason: 'Khách muốn giữ đơn',
    }).expect(201);
    await request(app.getHttpServer())
      .patch(`/orders/${f.orderId}/status`)
      .set('Authorization', `Bearer ${barista}`)
      .send({ status: 'PREPARING' })
      .expect(200);
    expect(
      (
        await prisma.ingredient.findUniqueOrThrow({
          where: { id: f.ingredientId },
        })
      ).stock.toNumber(),
    ).toBe(980);
    await post(`/orders/${f.orderId}/cancel`, customer).expect(409);
    expect(await creditCount(f.orderId)).toBe(0);
  });

  it('chỉ chủ đơn yêu cầu, ADMIN/BARISTA duyệt; chặn đơn COMPLETED/CANCELLED', async () => {
    const f = await paid();
    await post(`/orders/${f.orderId}/cancel`, other).expect(404);
    for (const endpoint of [
      'approve-refund',
      'reject-refund',
      'resolve-refund',
    ]) {
      await post(`/orders/${f.orderId}/${endpoint}`, customer).expect(403);
      await request(app.getHttpServer())
        .post(`/orders/${f.orderId}/${endpoint}`)
        .send({})
        .expect(401);
    }
    await prisma.order.update({
      where: { id: f.orderId },
      data: { status: OrderStatus.COMPLETED },
    });
    await post(`/orders/${f.orderId}/cancel`, customer).expect(409);
    await prisma.order.update({
      where: { id: f.orderId },
      data: { status: OrderStatus.CANCELLED },
    });
    await post(`/orders/${f.orderId}/cancel`, customer).expect(409);
  });

  it('race yêu cầu / bắt đầu pha chế chỉ một thao tác thắng khóa order', async () => {
    const f = await paid();
    const res = await Promise.all([
      post(`/orders/${f.orderId}/cancel`, customer),
      request(app.getHttpServer())
        .patch(`/orders/${f.orderId}/status`)
        .set('Authorization', `Bearer ${barista}`)
        .send({ status: 'PREPARING' }),
    ]);
    expect(res.filter((r) => r.status === 409)).toHaveLength(1);
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: f.orderId },
      include: { refundRequest: true },
    });
    if (order.status === 'PREPARING') expect(order.refundRequest).toBeNull();
    else expect(order.refundRequest?.status).toBe('PENDING');
  });

  it('không tin số điểm/tỷ lệ client gửi và chặn số tiền giao dịch sai', async () => {
    const f = await paid();
    await post(`/orders/${f.orderId}/cancel`, customer, { amount: 1 }).expect(
      400,
    );
    await post(`/orders/${f.orderId}/cancel`, customer).expect(201);
    await prisma.payment.update({
      where: { id: f.payment.id },
      data: { amount: 1 },
    });
    await post(`/orders/${f.orderId}/approve-refund`, admin).expect(409);
    expect(await creditCount(f.orderId)).toBe(0);
    await prisma.payment.update({
      where: { id: f.payment.id },
      data: { amount: f.payment.amount },
    });
    const result = await post(`/orders/${f.orderId}/approve-refund`, admin, {
      refundPoints: 999999,
      vndPerPoint: 1,
      refundMethod: 'CASH',
    }).expect(201);
    expect(result.body.refundRequest).toMatchObject({
      refundPoints: 90,
      vndPerPoint: 1000,
      refundMethod: 'POINTS',
    });
  });

  it('thu hồi thưởng đã dùng rồi mới cộng điểm hoàn, không được giữ thưởng của đơn hủy', async () => {
    const f = await paid();
    const current = await balance();
    await prisma.user.update({
      where: { id: customerId },
      data: { loyaltyPoints: 0 },
    });
    await prisma.loyaltyTransaction.create({
      data: { userId: customerId, type: 'REDEEM', points: current },
    });
    await post(`/orders/${f.orderId}/cancel`, customer).expect(201);
    await post(`/orders/${f.orderId}/approve-refund`, admin).expect(201);
    expect(await balance()).toBe(81);
    expect(
      (
        await prisma.loyaltyTransaction.findFirstOrThrow({
          where: { orderId: f.orderId, type: 'REFUND_CREDIT' },
        })
      ).points,
    ).toBe(90);
    expect(
      (
        await prisma.loyaltyTransaction.findFirstOrThrow({
          where: { orderId: f.orderId, type: 'REFUND' },
        })
      ).points,
    ).toBe(-9);
  });

  it('không dùng endpoint đối soát CASH để cộng điểm hoặc bỏ qua transaction mới', async () => {
    const f = await paid();
    await post(`/orders/${f.orderId}/cancel`, customer).expect(201);
    await post(`/orders/${f.orderId}/resolve-refund`, admin, {
      status: 'SUCCEEDED',
      evidence: 'Không được dùng cách ghi nhận này',
    }).expect(404);
    expect(await creditCount(f.orderId)).toBe(0);
  });
});
