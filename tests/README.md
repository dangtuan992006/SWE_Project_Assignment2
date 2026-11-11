# Thư mục Kiểm thử Tích hợp và End-to-End (`tests/`)

Thư mục này được tổ chức theo quy chuẩn cấu trúc Monorepo quy định tại **Mục 9 (Cấu trúc repository)** và đáp ứng yêu cầu của **Task 5.2 (Tích hợp và kiểm thử)** trong tài liệu đặc tả Assignment 2.

---

## 1. Mục đích và Phân loại Kiểm thử

Hệ thống BrewLite triển khai mô hình kim tự tháp kiểm thử (Test Pyramid) đầy đủ 3 tầng:

1. **Unit Test (Kiểm thử đơn vị - 326 tests pass 100%):**
   - Vị trí: `apps/api/src/**/*.spec.ts`
   - Mục đích: Kiểm thử độc lập logic nghiệp vụ của từng Service (tính tiền giỏ hàng, bảng giá theo size/topping, mã hóa bcrypt, phát hành token JWT, máy trạng thái đơn hàng Order State Machine, xử lý hủy đơn hết hạn...).
   - Công nghệ: Jest kết hợp Prisma Service giả lập.

2. **Integration Test (Kiểm thử tích hợp):**
   - Vị trí: `apps/api/src/payments/*.spec.ts`, `apps/api/src/orders/*.spec.ts`
   - Mục đích: Kiểm thử tích hợp giữa các tầng dịch vụ, transaction database, kiểm soát xung đột đồng thời (optimistic locking) và xác thực chữ ký bảo mật checksum VNPay HMAC-SHA512.

3. **End-to-End Test (Kiểm thử luồng tích hợp toàn diện):**
   - Vị trí: `tests/e2e-checkout.flow.mjs` và `apps/api/test/app.e2e-spec.ts`
   - Mục đích: Kiểm chứng hoạt động đồng bộ của toàn bộ hệ thống từ góc nhìn người dùng thực tế, từ duyệt thực đơn, chọn size/topping, đăng ký, đăng nhập JWT, gửi đơn hàng kèm `Idempotency-Key` đến khởi tạo thanh toán không tiền mặt và tra cứu lịch sử đơn.

---

## 2. Hướng dẫn Chạy Kiểm thử

### 2.1. Chạy Unit Test & Integration Test (Backend API)

```bash
cd apps/api
pnpm test
```
*Kết quả:* Chạy toàn bộ 24 test suites với 326 unit/integration tests với kết quả 100% Passed.

### 2.2. Chạy E2E Test nội bộ NestJS Test Server

```bash
cd apps/api
pnpm test:e2e
```
*Mục đích:* Tự động dựng ứng dụng NestJS trên bộ nhớ cùng kết nối database để kiểm thử luồng `/products` -> `/auth/register` -> `/auth/login` -> `/orders` (kèm kiểm tra 401 Unauthorized và Replay Idempotency).

### 2.3. Chạy Kịch bản E2E Black-box Runner (`tests/e2e-checkout.flow.mjs`)

Kịch bản này là script độc lập chạy bằng Node.js thuần (ESM), có thể kiểm thử trực tiếp lên máy chủ local hoặc hệ thống đã triển khai Production/Staging:

**Chạy với máy chủ local:**
```bash
# Đảm bảo backend đã khởi động (ở cổng 3001)
node tests/e2e-checkout.flow.mjs
```

**Chạy với máy chủ Staging / Production trên Cloud:**
```bash
node tests/e2e-checkout.flow.mjs https://api-brewlite.onrender.com
# hoặc truyền biến môi trường API_URL:
API_URL=https://api-brewlite.onrender.com node tests/e2e-checkout.flow.mjs
```

---

## 3. Các bước kiểm thử trong `e2e-checkout.flow.mjs`

| Bước | Endpoint | Mục đích kiểm thử | Mã RTM liên quan |
| :--- | :--- | :--- | :--- |
| **Bước 1** | `GET /health` hoặc `GET /` | Kiểm tra tính sẵn sàng của máy chủ API | `NFR-01`, `SYS-PERF-01` |
| **Bước 2** | `GET /products` | Lấy danh sách thực đơn đồ uống, kiểm tra tồn kho | `FR-03`, `API-PROD-01` |
| **Bước 3** | `GET /products/:id` | Xem chi tiết sản phẩm, giá các size và topping | `FR-04`, `FR-05` |
| **Bước 4** | `POST /auth/register` | Đăng ký tài khoản khách hàng, bảo mật không lộ hash | `FR-01`, `UNIT-AUTH-01` |
| **Bước 5** | `POST /auth/login` | Xác thực đăng nhập, nhận JWT Access Token | `FR-02`, `NFR-03` |
| **Bước 6** | `POST /orders` | Tạo đơn hàng mới kèm `Idempotency-Key` (Status: PENDING) | `FR-12`, `INT-ORD-01` |
| **Bước 7** | `POST /orders` (Replay) | Gửi lại cùng `Idempotency-Key`, kiểm tra chống tạo trùng đơn | `NFR-10`, `INT-SM-02` |
| **Bước 8** | `POST /payments` | Khởi tạo giao dịch thanh toán không tiền mặt VNPay | `FR-13`, `INT-PAY-01` |
| **Bước 9** | `GET /orders/me` | Truy vấn lịch sử đơn hàng của tài khoản vừa tạo | `FR-15`, `API-ORD-01` |

---

## 4. Liên kết Ma trận Truy vết (RTM)

Toàn bộ các ca kiểm thử trong thư mục này được ánh xạ trực tiếp và truy vết hai chiều với tài liệu [docs/traceability-matrix.md](../docs/traceability-matrix.md) và đặc tả yêu cầu người dùng [docs/requirements/SRS.md](../docs/requirements/SRS.md).
