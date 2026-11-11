# Nhật ký Phát hành Phiên bản (Release Notes)
## Dự án BrewLite — Nền tảng Đặt Cà phê Trực tuyến Thông minh

Tài liệu này ghi nhận lịch sử phát hành các phiên bản phần mềm theo tiêu chuẩn Semantic Versioning (`vMAJOR.MINOR.PATCH`), đáp ứng yêu cầu của **Task 5.4 và Mục 9.1** trong đề bài Assignment 2.

---

## 🚀 Phiên bản v2.0.0 — Sprint 2: Full End-to-End Flow & Production Delivery
**Ngày phát hành:** 11/11/2026  
**Trọng tâm Sprint 2:** Hoàn thiện luồng người dùng toàn diện từ đặt món đến thanh toán không tiền mặt, thiết lập dây chuyền CI/CD tự động 4 giai đoạn, kiểm thử tích hợp E2E và đóng gói sẵn sàng cho môi trường Production.

### 1. Tính năng mới (New Features)
- **Hoàn thiện giỏ hàng và tùy biến sản phẩm (FR-05 $\rightarrow$ FR-11):**
  - Khách hàng có thể chọn kích cỡ Size (S/M/L) và các loại Topping ăn kèm (Trân châu trắng, Thạch nha đam, Kem cheese).
  - Quản lý trạng thái giỏ hàng phía Client bằng Zustand Store (`cartStore.ts`), tự động tính toán tổng giá tiền và hiển thị huy hiệu (Badge) số lượng món trực quan.
- **Tạo đơn hàng & Cơ chế bảo vệ Idempotency (FR-12, NFR-10):**
  - Endpoint `POST /orders` cho phép đặt đơn hàng từ giỏ hàng.
  - Header `Idempotency-Key` (UUIDv4) chống tạo trùng đơn hàng khi mạng chập chờn hoặc người dùng bấm lặp lại.
- **Tích hợp Cổng thanh toán không tiền mặt VNPay Sandbox (FR-13):**
  - Endpoint `POST /payments` khởi tạo giao dịch thanh toán trực tuyến an toàn.
  - Mã hóa bảo mật chữ ký HMAC-SHA512 đối chiếu với VNPay Gateway.
  - Endpoint `GET /payments/vnpay/return` và `GET /payments/vnpay/ipn` xử lý kết quả thanh toán thời gian thực và tự động cập nhật trạng thái đơn sang `PAID`.
  - Cơ chế đối soát ngoại lệ giao dịch đến chậm (*Delayed IPN callback*) dựa trên dấu thời gian thực `vnp_PayDate` và nhãn `ORDER_PAYMENT_EXPIRED`.
- **Máy trạng thái đơn hàng chuẩn mực (Order State Machine - ADR-003):**
  - Quản lý 7 trạng thái vòng đời đơn: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED` (hoặc `PAYMENT_FAILED` / `CANCELLED`).
  - Dịch vụ tự động hủy đơn hết hạn sau cửa sổ thanh toán 15 phút và hoàn trả lại số lượng tồn kho.
- **Hệ thống xác thực và phân quyền (FR-01, FR-02, NFR-03, NFR-04):**
  - Đăng ký và đăng nhập bảo mật với mật khẩu băm Bcrypt 10 vòng muối.
  - Cấp phát Bearer Access Token chuẩn JWT có thời hạn.
  - `UserOwnershipGuard` và `RolesGuard` bảo vệ tài nguyên người dùng và phân quyền Barista / Khách hàng.

### 2. Tự động hóa CI/CD & Đóng gói Container (DevOps)
- **Pipeline CI (`.github/workflows/ci.yml`):** Chạy tự động trên mọi Pull Request kiểm tra linter (`oxlint`), chạy toàn bộ bài kiểm thử và build ứng dụng.
- **Pipeline CD (`.github/workflows/cd.yml`):** Dây chuyền phân phối liên tục 4 giai đoạn:
  $$\text{Quality Gate (Lint & Test)} \longrightarrow \text{Build Artifacts} \longrightarrow \text{Docker Image & Cloud Deploy} \longrightarrow \text{Smoke Test}$$
- **Multi-stage Dockerfile:** Tối ưu hóa dung lượng image với Node.js 20 Alpine, tích hợp cơ chế tự động nạp dữ liệu menu (*auto-seed*) khi CSDL mới tinh.

### 3. Kiểm thử Hệ thống (Quality Assurance)
- **Unit & Integration Tests:** 24 test suites với **326 bài kiểm thử Backend** đạt tỷ lệ vượt qua **100%**.
- **Frontend Unit Tests:** 28 bài kiểm thử client cho luồng thanh toán VNPay (`apps/web/tests/vnpay-payment.test.mjs`) pass 100%.
- **End-to-End Runner:** Kịch bản kiểm thử độc lập [`tests/e2e-checkout.flow.mjs`](../tests/e2e-checkout.flow.mjs) tự động hóa 9 bước kiểm tra luồng người dùng từ menu đến thanh toán và tra cứu lịch sử.

---

## 📦 Phiên bản v1.0.0 — Sprint 1: Technical Foundation & MVP Menu Catalog
**Ngày phát hành:** 04/11/2026  
**Trọng tâm Sprint 1:** Thiết lập nền tảng kỹ thuật Monorepo, quản lý phiên bản mã nguồn, tài liệu hóa kiến trúc và xây dựng MVP đầu tiên chạy được cho luồng xem thực đơn đồ uống.

### 1. Tính năng cốt lõi (MVP Features)
- **Danh mục đồ uống trực tuyến (FR-03, US-01):**
  - Endpoint `GET /products` trả về danh sách đồ uống kèm hình ảnh, tên món, mô tả và giá tiền theo size chuẩn.
  - Giao diện người dùng Next.js mobile-first hiển thị danh mục theo dạng lưới trực quan.
- **Xem chi tiết sản phẩm (FR-04, US-02):**
  - Endpoint `GET /products/:id` cung cấp thông tin chi tiết từng món đồ uống.
- **Lọc theo danh mục đồ uống:**
  - Hỗ trợ phân loại theo: Cà phê pha phin, Cà phê pha máy, Trà trái cây, Trà sữa, Đá xay.
- **Trạng thái tồn kho cơ bản:**
  - Hiển thị nhãn trạng thái còn hàng (`In Stock`) hoặc hết hàng (`Out of Stock`) dựa trên trường `stock` và `isAvailable`.

### 2. Kiến trúc & Nền tảng Kỹ thuật
- **Cấu trúc Monorepo:** Tách biệt rõ ràng giữa Backend NestJS (`apps/api`), Frontend Next.js (`apps/web`) và Tài liệu thiết kế (`docs/`).
- **Cơ sở dữ liệu:** Thiết lập PostgreSQL 16 chạy qua Docker Compose, quản lý lược đồ dữ liệu và migration bằng Prisma ORM.
- **Tài liệu hóa thiết kế:** Hoàn thành Bối cảnh & Phạm vi, Đặc tả yêu cầu phần mềm (SRS), 4 sơ đồ UML (Activity, Sequence, Class, Deployment) và 3 bản ADR nền tảng.
- **Tích hợp CI:** Thiết lập GitHub Actions chạy tự động trên nhánh phát triển để đảm bảo không merge mã nguồn bị lỗi.
