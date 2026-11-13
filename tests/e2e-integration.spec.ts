/**
 * ==============================================================================
 * BrewLite - Đặc tả Kiểm thử Tích hợp E2E Black-Box (Node 24 Native Test Runner)
 * Khớp với Ma trận Truy vết RTM (E2E-FLOW-01, E2E-ORD-01, E2E-AUTH-01)
 *
 * Chạy trực tiếp trên Node.js >= 24 (TypeScript type-stripping tích hợp):
 *   node --test tests/e2e-integration.spec.ts
 * ==============================================================================
 */

import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';

interface HealthResponse {
  status: string;
  service?: string;
}

interface ToppingOption {
  id: string;
  name: string;
  price: number;
  isAvailable?: boolean;
}

interface ProductDto {
  id: string;
  name: string;
  priceS: number;
  priceM: number;
  priceL: number;
  stock: number;
  isAvailable?: boolean;
  toppingOptions?: ToppingOption[];
}

interface RegisterResponse {
  id: string;
  email: string;
  loyaltyPoints: number;
  password?: unknown;
  passwordHash?: unknown;
}

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

interface OrderResponse {
  orderId?: string;
  id?: string;
  status: string;
  totalAmount: string;
}

interface PaymentConfigResponse {
  provider: 'MOCK' | 'VNPAY';
}

interface MockPaymentResponse {
  replayed?: boolean;
  status: string;
  payment?: {
    id: string;
  };
}

interface VnpayPaymentResponse {
  orderId: string;
  paymentId: string;
  status: string;
  paymentUrl: string;
}

interface ApiResult<T> {
  status: number;
  headers: Headers;
  data: T;
}

const TARGET_API = (process.env.API_URL || 'http://localhost:8080').replace(/\/+$/, '');

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };

  const response = await fetch(`${TARGET_API}${path}`, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = (
    contentType.includes('application/json') ? await response.json() : await response.text()
  ) as T;

  return { status: response.status, headers: response.headers, data };
}

describe('BrewLite E2E Integration Suite (Task 5.2)', () => {
  let selectedProduct: ProductDto | undefined;
  let accessToken = '';
  let createdOrderId = '';
  const testEmail = `e2e_spec_${Date.now()}_${randomUUID().slice(0, 8)}@brewlite.test`;
  const testPassword = 'MatKhau123!Secure';

  it('Yêu cầu hệ thống phải phản hồi /health và /payments/config hợp lệ', async () => {
    assert.match(TARGET_API, /^https?:\/\//);

    const healthRes = await apiRequest<HealthResponse>('/health');
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.data.status, 'ok');

    const configRes = await apiRequest<PaymentConfigResponse>('/payments/config');
    assert.equal(configRes.status, 200);
    assert.ok(configRes.data.provider === 'MOCK' || configRes.data.provider === 'VNPAY');
  });

  describe('Luồng nghiệp vụ Đặt món và Thanh toán (US-01 -> US-11)', () => {
    it('FR-03: Cho phép khách hàng truy vấn danh mục và chi tiết sản phẩm đồ uống', async () => {
      const listRes = await apiRequest<ProductDto[]>('/products');
      assert.equal(listRes.status, 200);
      assert.ok(Array.isArray(listRes.data));
      assert.ok(listRes.data.length > 0, 'Danh mục sản phẩm phải có dữ liệu sau khi seed');

      selectedProduct =
        listRes.data.find((p) => p.isAvailable !== false && p.stock > 0) ?? listRes.data[0];
      assert.ok(selectedProduct?.id);

      const detailRes = await apiRequest<ProductDto>(`/products/${selectedProduct.id}`);
      assert.equal(detailRes.status, 200);
      assert.equal(detailRes.data.id, selectedProduct.id);
      assert.equal(typeof detailRes.data.priceM, 'number');
    });

    it('FR-01 & FR-02: Cho phép khách hàng đăng ký và đăng nhập xác thực JWT', async () => {
      const registerRes = await apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          fullName: 'Integration Spec Tester',
        }),
      });
      assert.equal(registerRes.status, 201);
      assert.equal(registerRes.data.email, testEmail);
      assert.equal(registerRes.data.password, undefined);
      assert.equal(registerRes.data.passwordHash, undefined);

      const loginRes = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      assert.equal(loginRes.status, 200);
      assert.ok(loginRes.data.accessToken.length > 0);
      accessToken = loginRes.data.accessToken;

      const meRes = await apiRequest<{ email: string; role: string }>('/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      assert.equal(meRes.status, 200);
      assert.equal(meRes.data.email, testEmail);
    });

    it('FR-12 & NFR-10: Chặn POST /orders thiếu JWT (401) và tạo đơn an toàn với Idempotency-Key', async () => {
      assert.ok(selectedProduct, 'Cần sản phẩm từ bước FR-03');
      assert.ok(accessToken, 'Cần JWT từ bước FR-01 & FR-02');

      const availableTopping = selectedProduct.toppingOptions?.find((t) => t.isAvailable !== false);
      const orderPayload = {
        items: [
          {
            productId: selectedProduct.id,
            size: 'M',
            quantity: 1,
            toppingIds: availableTopping ? [availableTopping.id] : [],
          },
        ],
        note: 'Integration spec order',
      };

      const unauthRes = await apiRequest<unknown>('/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': randomUUID() },
        body: JSON.stringify(orderPayload),
      });
      assert.equal(unauthRes.status, 401);

      const orderKey = randomUUID();
      const createRes = await apiRequest<OrderResponse>('/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Idempotency-Key': orderKey,
        },
        body: JSON.stringify(orderPayload),
      });
      assert.equal(createRes.status, 201);
      createdOrderId = createRes.data.orderId ?? createRes.data.id ?? '';
      assert.ok(createdOrderId.length > 0);
      assert.equal(createRes.data.status, 'PENDING');

      const replayRes = await apiRequest<OrderResponse>('/orders', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Idempotency-Key': orderKey,
        },
        body: JSON.stringify(orderPayload),
      });
      assert.equal(replayRes.status, 200);
      assert.equal(replayRes.data.orderId ?? replayRes.data.id, createdOrderId);
    });

    it('FR-13: Hỗ trợ khởi tạo thanh toán không tiền mặt theo cấu hình provider (MOCK / VNPay)', async () => {
      assert.ok(createdOrderId, 'Cần orderId từ bước FR-12');
      assert.ok(accessToken, 'Cần JWT từ bước FR-01 & FR-02');

      const configRes = await apiRequest<PaymentConfigResponse>('/payments/config');
      assert.equal(configRes.status, 200);

      const paymentKey = randomUUID();

      if (configRes.data.provider === 'MOCK') {
        const payRes = await apiRequest<MockPaymentResponse>('/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Idempotency-Key': paymentKey,
          },
          body: JSON.stringify({
            orderId: createdOrderId,
            paymentMethod: 'E_WALLET',
          }),
        });
        assert.equal(payRes.status, 200);
        assert.equal(payRes.data.status, 'PAID');
        assert.ok(payRes.data.payment?.id);

        const replayRes = await apiRequest<MockPaymentResponse>('/payments', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Idempotency-Key': paymentKey,
          },
          body: JSON.stringify({
            orderId: createdOrderId,
            paymentMethod: 'E_WALLET',
          }),
        });
        assert.equal(replayRes.status, 200);
        assert.equal(replayRes.data.payment?.id, payRes.data.payment?.id);
        assert.ok(
          replayRes.headers.get('idempotent-replayed') === 'true' || replayRes.data.replayed === true,
        );
        return;
      }

      const vnpayRes = await apiRequest<VnpayPaymentResponse>('/payments/vnpay/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Idempotency-Key': paymentKey,
        },
        body: JSON.stringify({ orderId: createdOrderId }),
      });
      assert.equal(vnpayRes.status, 200);
      assert.equal(vnpayRes.data.orderId, createdOrderId);
      const parsed = new URL(vnpayRes.data.paymentUrl);
      assert.ok(parsed.protocol === 'https:' || parsed.protocol === 'http:');
    });

    it('FR-15: Cho phép người dùng xem lịch sử các đơn hàng đã đặt', async () => {
      assert.ok(createdOrderId, 'Cần orderId từ bước FR-12');
      assert.ok(accessToken, 'Cần JWT từ bước FR-01 & FR-02');

      const unauthHistoryRes = await apiRequest<unknown>('/orders/me');
      assert.equal(unauthHistoryRes.status, 401);

      const historyRes = await apiRequest<OrderResponse[]>('/orders/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      assert.equal(historyRes.status, 200);
      assert.ok(Array.isArray(historyRes.data));
      assert.ok(historyRes.data.some((o) => (o.orderId ?? o.id) === createdOrderId));

      const detailRes = await apiRequest<OrderResponse>(`/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      assert.equal(detailRes.status, 200);
      assert.equal(detailRes.data.orderId ?? detailRes.data.id, createdOrderId);
    });
  });
});
