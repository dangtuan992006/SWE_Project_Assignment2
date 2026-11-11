/**
 * ==============================================================================
 * BrewLite - Kịch bản Kiểm thử Tích hợp Luồng End-to-End (E2E Integration Flow)
 * Tuân thủ yêu cầu Task 5.2 & Cấu trúc Repository Mục 9 - Assignment 2
 * ==============================================================================
 *
 * Cách chạy:
 *   node tests/e2e-checkout.flow.mjs [API_BASE_URL]
 *
 * Mặc định API_BASE_URL: http://localhost:3001
 * Ví dụ chạy test với môi trường Production / Staging:
 *   node tests/e2e-checkout.flow.mjs https://api-brewlite.onrender.com
 */

import { randomUUID } from 'node:crypto';

const BASE_URL = process.argv[2] || process.env.API_URL || 'http://localhost:3001';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function logStep(step, message) {
  console.log(`\n${colors.cyan}${colors.bold}[BƯỚC ${step}]${colors.reset} ${message}`);
}

function logPass(message) {
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${message}`);
}

function logFail(message, detail = '') {
  console.error(`  ${colors.red}✖ FAIL:${colors.reset} ${message}`);
  if (detail) console.error(`    Chi tiết:`, detail);
}

let passedCount = 0;
let failedCount = 0;

async function runTest(name, fn) {
  try {
    await fn();
    passedCount++;
  } catch (error) {
    failedCount++;
    logFail(name, error.message || error);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data, headers: response.headers };
}

async function main() {
  console.log(`${colors.bold}${colors.yellow}==============================================================${colors.reset}`);
  console.log(`${colors.bold}   BrewLite E2E Integration Test Runner - Assignment 2        ${colors.reset}`);
  console.log(`   Target Server: ${colors.cyan}${BASE_URL}${colors.reset}`);
  console.log(`   Thời gian chạy: ${new Date().toISOString()}`);
  console.log(`${colors.bold}${colors.yellow}==============================================================${colors.reset}`);

  // Biến chia sẻ qua các bước
  let selectedProduct = null;
  let testUser = {
    email: `e2e_user_${Date.now()}_${Math.floor(Math.random() * 1000)}@brewlite.test`,
    password: 'MatKhau123!Secure',
    fullName: 'Tester Kiểm Thử E2E',
  };
  let authToken = null;
  let currentOrderId = null;
  const idempotencyKey = randomUUID();

  // BƯỚC 1: Health Check
  logStep(1, 'Kiểm tra độ sẵn sàng của máy chủ (Health Check Endpoint)');
  await runTest('Kiểm tra GET /health hoặc GET /', async () => {
    let res = await request('/health');
    if (res.status === 404) {
      res = await request('/');
    }
    if (res.status !== 200) {
      throw new Error(`Máy chủ không phản hồi 200 (nhận ${res.status}). Server có đang chạy ở ${BASE_URL}?`);
    }
    logPass(`Máy chủ đang hoạt động bình thường (HTTP status: ${res.status}).`);
  });

  // Nếu bước 1 fail và không kết nối được server, dừng sớm
  if (failedCount > 0) {
    console.log(`\n${colors.red}${colors.bold}LƯU Ý: Không thể kết nối tới Server API tại ${BASE_URL}.${colors.reset}`);
    console.log(`Vui lòng khởi động backend API trước khi chạy kịch bản này:`);
    console.log(`  cd apps/api && pnpm start:dev`);
    console.log(`hoặc chạy qua Docker Compose:`);
    console.log(`  docker compose up -d\n`);
    process.exit(1);
  }

  // BƯỚC 2: Xem danh mục sản phẩm (US-01 / FR-03)
  logStep(2, 'Lấy danh mục đồ uống và danh sách thực đơn (GET /products)');
  await runTest('Lấy danh sách đồ uống thành công', async () => {
    const res = await request('/products');
    if (res.status !== 200 || !Array.isArray(res.data)) {
      throw new Error(`Kỳ vọng mảng sản phẩm HTTP 200, nhận: ${res.status}`);
    }
    if (res.data.length === 0) {
      throw new Error('Danh mục đồ uống rỗng. Hãy chạy npm run prisma:seed để nạp dữ liệu mẫu.');
    }
    selectedProduct = res.data.find(p => p.stock > 0) || res.data[0];
    logPass(`Lấy thành công danh mục: ${res.data.length} món đồ uống. Chọn thử nghiệm: "${selectedProduct.name}" (ID: ${selectedProduct.id})`);
  });

  // BƯỚC 3: Xem chi tiết sản phẩm và tùy chọn (US-02, US-03 / FR-04, FR-05)
  logStep(3, `Xem chi tiết sản phẩm và bảng giá theo Size/Topping (GET /products/${selectedProduct.id})`);
  await runTest('Xác thực thông tin chi tiết sản phẩm và size/topping', async () => {
    const res = await request(`/products/${selectedProduct.id}`);
    if (res.status !== 200 || !res.data || !res.data.id) {
      throw new Error(`Không lấy được chi tiết sản phẩm HTTP ${res.status}`);
    }
    const p = res.data;
    if (typeof p.priceM !== 'number' && typeof p.priceM !== 'string') {
      throw new Error('Thiếu cấu hình giá Size M trong sản phẩm');
    }
    logPass(`Sản phẩm "${p.name}": Size M = ${p.priceM} VNĐ, Số lượng tồn kho = ${p.stock}`);
  });

  // BƯỚC 4: Đăng ký tài khoản khách hàng mới (UC-01 / FR-01)
  logStep(4, `Đăng ký tài khoản khách hàng mới (POST /auth/register)`);
  await runTest('Tạo tài khoản khách hàng mới', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Đăng ký thất bại với mã HTTP ${res.status}: ${JSON.stringify(res.data)}`);
    }
    if (res.data.password || res.data.passwordHash) {
      throw new Error('Lỗ hổng bảo mật: API trả về password/passwordHash trong response!');
    }
    logPass(`Đăng ký tài khoản thành công: ${testUser.email}`);
  });

  // BƯỚC 5: Đăng nhập nhận JWT Token (UC-02 / FR-02, NFR-03)
  logStep(5, `Đăng nhập để nhận Bearer Access Token (POST /auth/login)`);
  await runTest('Đăng nhập và xác thực JWT token', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    if (res.status !== 200 || !res.data.accessToken) {
      throw new Error(`Đăng nhập thất bại: ${JSON.stringify(res.data)}`);
    }
    authToken = res.data.accessToken;
    logPass(`Đăng nhập thành công, nhận JWT Token (độ dài: ${authToken.length} ký tự)`);
  });

  // BƯỚC 6: Tạo đơn hàng với Idempotency Key (UC-03 / FR-12, NFR-10)
  logStep(6, `Tạo đơn hàng kèm Idempotency-Key chống trùng (POST /orders)`);
  const orderPayload = {
    items: [
      {
        productId: selectedProduct.id,
        size: 'M',
        quantity: 2,
        toppingIds: selectedProduct.toppingOptions && selectedProduct.toppingOptions[0] ? [selectedProduct.toppingOptions[0].id] : [],
      },
    ],
    note: 'Đơn hàng kiểm thử E2E tự động - Ít ngọt, nhiều đá',
  };

  await runTest('Tạo đơn hàng thành công trạng thái PENDING', async () => {
    const res = await request('/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Tạo đơn thất bại (HTTP ${res.status}): ${JSON.stringify(res.data)}`);
    }
    const order = res.data;
    currentOrderId = order.orderId || order.id;
    if (!currentOrderId) {
      throw new Error('API không trả về orderId trong response');
    }
    if (order.status !== 'PENDING') {
      throw new Error(`Trạng thái ban đầu không đúng: ${order.status} (kỳ vọng PENDING)`);
    }
    logPass(`Tạo đơn hàng thành công: ID = ${currentOrderId}, Trạng thái = ${order.status}, Tổng tiền = ${order.totalAmount}`);
  });

  // BƯỚC 7: Kiểm tra cơ chế chống Replay Attack / Chống trùng đơn (Idempotency Key)
  logStep(7, `Kiểm tra khả năng bảo vệ trùng lặp với cùng Idempotency-Key (Replay Protection)`);
  await runTest('Gửi lại cùng Idempotency-Key trả về cùng đơn hàng cũ', async () => {
    const res = await request('/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Yêu cầu lặp lại thất bại: HTTP ${res.status}`);
    }
    const duplicateOrderId = res.data.orderId || res.data.id;
    if (duplicateOrderId !== currentOrderId) {
      throw new Error(`Idempotency thất bại: tạo đơn mới (${duplicateOrderId}) thay vì trả về đơn cũ (${currentOrderId})!`);
    }
    logPass(`Hệ thống nhận diện đúng Idempotency-Key: Giữ nguyên đơn ${currentOrderId}, không tạo trùng đơn.`);
  });

  // BƯỚC 8: Khởi tạo thanh toán không tiền mặt VNPay (UC-04 / FR-13)
  logStep(8, `Khởi tạo phiên thanh toán không tiền mặt VNPay (POST /payments)`);
  await runTest('Tạo liên kết thanh toán VNPay', async () => {
    const res = await request('/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        orderId: currentOrderId,
        paymentMethod: 'VNPAY',
        bankCode: 'NCB',
      }),
    });

    if (res.status !== 201 && res.status !== 200) {
      throw new Error(`Khởi tạo thanh toán thất bại (HTTP ${res.status}): ${JSON.stringify(res.data)}`);
    }
    logPass(`Khởi tạo thanh toán thành công cho đơn hàng ${currentOrderId}.`);
  });

  // BƯỚC 9: Kiểm tra lịch sử đơn hàng của người dùng (US-11 / FR-15)
  logStep(9, `Truy vấn lịch sử đơn hàng của khách hàng (GET /orders/me)`);
  await runTest('Khách hàng xem danh sách đơn hàng đã tạo', async () => {
    const res = await request('/orders/me', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.status !== 200 || !Array.isArray(res.data)) {
      throw new Error(`Không lấy được lịch sử đơn hàng: HTTP ${res.status}`);
    }
    const found = res.data.some(o => (o.orderId || o.id) === currentOrderId);
    if (!found) {
      throw new Error(`Không tìm thấy đơn hàng ${currentOrderId} trong lịch sử /orders/me`);
    }
    logPass(`Đơn hàng ${currentOrderId} hiển thị chính xác trong danh sách lịch sử.`);
  });

  // TỔNG KẾT
  console.log(`\n${colors.bold}${colors.yellow}==============================================================${colors.reset}`);
  console.log(`${colors.bold}   KẾT QUẢ KIỂM THỬ TÍCH HỢP TOÀN DIỆN (E2E FLOW SUMMARY)     ${colors.reset}`);
  console.log(`${colors.bold}${colors.yellow}==============================================================${colors.reset}`);
  console.log(`   ${colors.green}✔ Tổng số bài kiểm thử VƯỢT QUA (PASSED): ${passedCount}${colors.reset}`);
  if (failedCount > 0) {
    console.log(`   ${colors.red}✖ Tổng số bài kiểm thử THẤT BẠI (FAILED): ${failedCount}${colors.reset}`);
  } else {
    console.log(`   ${colors.green}${colors.bold}🎉 100% CÁC BƯỚC LUỒNG END-TO-END ĐỀU THÀNH CÔNG!${colors.reset}`);
  }
  console.log(`${colors.bold}${colors.yellow}==============================================================${colors.reset}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Lỗi ngoài dự kiến khi thực thi E2E runner:', err);
  process.exit(1);
});
