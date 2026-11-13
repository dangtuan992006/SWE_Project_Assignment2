# Thư mục Kiểm thử Tích hợp và End-to-End (`tests/`)

Thư mục này được tổ chức theo quy chuẩn cấu trúc Monorepo quy định tại **Mục 9 (Cấu trúc repository)** và đáp ứng yêu cầu của **Task 5.2 (Tích hợp và kiểm thử)** trong tài liệu đặc tả Assignment 2.

---

## 1. Mục đích và Phân loại Kiểm thử

Hệ thống BrewLite triển khai mô hình kim tự tháp kiểm thử (Test Pyramid) đầy đủ 3 tầng:

1. **Unit Test (Kiểm thử đơn vị - Backend & Frontend):**
   - Backend API: `apps/api/src/**/*.spec.ts` — kiểm thử logic nghiệp vụ của từng Service (tính tiền giỏ hàng, bảng giá theo size/topping, mã hóa bcrypt, phát hành token JWT, Order State Machine, tồn kho nguyên liệu, voucher & điểm thưởng, cấu hình & chữ ký VNPay HMAC-SHA512).
   - Frontend Web (`apps/web/tests/vnpay-payment.test.mjs`): 28 unit tests sử dụng `node --test` kiểm thử luồng thanh toán VNPay/Mock, `Idempotency-Key`, đối soát và kiểm tra origin hợp lệ.

2. **Integration Test (Kiểm thử tích hợp):**
   - Backend API: `apps/api/src/payments/*.spec.ts`, `apps/api/src/orders/*.spec.ts`.
   - Black-box HTTP Integration Suite: `tests/e2e-integration.spec.ts` — kiểm thử HTTP thực tế qua `node --test` (Node.js 24 TypeScript type-stripping) cho `/health`, `/payments/config`, `/products`, `/auth/*`, `POST /orders` (bao gồm 401 Unauthorized và Idempotency replay), thanh toán (`MOCK` / `VNPAY`) và `/orders/me`.

3. **End-to-End Test (Kiểm thử luồng tích hợp toàn diện):**
   - Vị trí: `tests/e2e-checkout.flow.mjs` và `apps/api/test/app.e2e-spec.ts`
   - Mục đích: Kiểm chứng hoạt động đồng bộ của toàn bộ hệ thống từ góc nhìn người dùng thực tế, từ duyệt thực đơn, chọn size/topping, đăng ký, đăng nhập JWT, gửi đơn hàng kèm `Idempotency-Key`, đọc cấu hình `/payments/config` để khởi tạo thanh toán (`MOCK` hoặc `VNPAY`) và tra cứu lịch sử đơn. Hỗ trợ cờ `--smoke` chỉ đọc, an toàn để kiểm tra môi trường Production.

---

## 2. Hướng dẫn Chạy Kiểm thử

### 2.1. Chạy Unit Test & Integration Test (Backend API & Frontend Web)

```bash
# Backend API unit & integration tests
cd apps/api
npm test

# Frontend Web VNPay & Payment tests (28 tests)
cd apps/web
npm run test:vnpay
```

### 2.2. Chạy E2E Test nội bộ NestJS Test Server

```bash
cd apps/api
npm run test:e2e
```
*Mục đích:* Tự động đồng bộ migration trên database kiểm thử `brewlite_test` (cấu hình trong `apps/api/.env.test`), dựng ứng dụng NestJS và kiểm thử luồng `/products` -> `/auth/register` -> `/auth/login` -> `/orders` (kèm kiểm tra 401 Unauthorized và Replay Idempotency).

### 2.3. Chạy Kịch bản E2E Black-box Runner (`tests/e2e-checkout.flow.mjs`)

Kịch bản này là script độc lập chạy bằng Node.js 24 thuần (ESM), có thể kiểm thử trực tiếp lên máy chủ local hoặc hệ thống đã triển khai Production/Staging:

**Chạy toàn bộ luồng E2E với máy chủ local (cổng mặc định `8080`):**
```bash
# Đảm bảo PostgreSQL đã chạy (docker compose up -d db), đã migrate/seed và backend API đang chạy ở cổng 8080
node tests/e2e-checkout.flow.mjs
```

**Chạy chế độ Smoke Check chỉ đọc (an toàn trên Production, không tạo user/order giả):**
```bash
node tests/e2e-checkout.flow.mjs --smoke
# Hoặc kiểm tra Production API:
node tests/e2e-checkout.flow.mjs --smoke https://brewlite-api-2tuk.onrender.com
```

**Chạy đầy đủ với máy chủ Staging / Production (tạo dữ liệu test):**
```bash
node tests/e2e-checkout.flow.mjs https://brewlite-api-2tuk.onrender.com
# hoặc truyền biến môi trường API_URL:
API_URL=https://brewlite-api-2tuk.onrender.com node tests/e2e-checkout.flow.mjs
```

### 2.4. Chạy Integration Test Spec (`tests/e2e-integration.spec.ts`)

Sử dụng test runner tích hợp sẵn của Node.js 24 (không cần cài thêm dependencies ở root):
```bash
# Chạy với máy chủ local mặc định http://localhost:8080
node --test tests/e2e-integration.spec.ts

# Hoặc chỉ định API_URL tùy chỉnh
API_URL=http://localhost:8080 node --test tests/e2e-integration.spec.ts
```

---

## 3. Các bước kiểm thử trong `e2e-checkout.flow.mjs`

| Bước | Endpoint | Chế độ | Mục đích kiểm thử | Mã RTM liên quan |
| :--- | :--- | :--- | :--- | :--- |
| **Bước 1** | `GET /health` | Full & `--smoke` | Kiểm tra tính sẵn sàng của máy chủ API | `NFR-01`, `SYS-PERF-01` |
| **Bước 2** | `GET /products` | Full & `--smoke` | Lấy danh sách thực đơn đồ uống, kiểm tra tồn kho | `FR-03`, `API-PROD-01` |
| **Bước 3** | `GET /products/:id` | Full & `--smoke` | Xem chi tiết sản phẩm, giá các size và topping | `FR-04`, `FR-05` |
| **Bước 4 (smoke)** | `GET /payments/config` | `--smoke` | Xác thực chế độ thanh toán (`MOCK` hoặc `VNPAY`) chỉ đọc | `FR-13`, `NFR-01` |
| **Bước 4** | `POST /auth/register` | Full | Đăng ký tài khoản khách hàng, bảo mật không lộ hash | `FR-01`, `UNIT-AUTH-01` |
| **Bước 5** | `POST /auth/login` | Full | Xác thực đăng nhập, nhận JWT Access Token | `FR-02`, `NFR-03` |
| **Bước 6** | `POST /orders` | Full | Tạo đơn hàng mới kèm `Idempotency-Key` (Status: `PENDING`) | `FR-12`, `INT-ORD-01` |
| **Bước 7** | `POST /orders` (Replay) | Full | Gửi lại cùng `Idempotency-Key`, kiểm tra chống tạo trùng đơn | `NFR-10`, `INT-SM-02` |
| **Bước 8** | `GET /payments/config` -> `POST /payments` hoặc `POST /payments/vnpay/create` | Full | Thanh toán `MOCK` (kèm kiểm tra `Idempotent-Replayed`) hoặc tạo URL thanh toán `VNPAY` | `FR-13`, `INT-PAY-01` |
| **Bước 9** | `GET /orders/me` | Full | Truy vấn lịch sử đơn hàng của tài khoản vừa tạo | `FR-15`, `API-ORD-01` |

---

## 4. Liên kết Ma trận Truy vết (RTM)

Toàn bộ các ca kiểm thử trong thư mục này được ánh xạ trực tiếp và truy vết hai chiều với tài liệu [docs/traceability-matrix.md](../docs/traceability-matrix.md) và đặc tả yêu cầu người dùng [docs/requirements/SRS.md](../docs/requirements/SRS.md).
