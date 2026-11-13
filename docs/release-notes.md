# Nhật ký Phát hành Phiên bản (Release Notes)
## Dự án BrewLite — Nền tảng Đặt Cà phê Trực tuyến Thông minh

Tài liệu này ghi nhận lịch sử phát hành các phiên bản phần mềm theo tiêu chuẩn Semantic Versioning (`vMAJOR.MINOR.PATCH`), đáp ứng yêu cầu của **Task 5.4 và Mục 9.1** trong đề bài Assignment 2.

---

## 🚀 Phiên bản v2.0.0 — Sprint 2: Full End-to-End Flow, Staff Portal & Production Delivery
**Ngày phát hành:** 13/11/2026  
**Trạng thái Git Tag & Release:** Đã phát hành chính thức (`Release v2.0.0`) trên GitHub sau khi merge PR #3 vào `main`.  
**Trọng tâm Sprint 2:** Hoàn thiện trọn vẹn luồng khách hàng không dùng tiền mặt, mở rộng cổng vận hành Staff Portal (`/staff`) & quản lý kho nguyên liệu, bổ sung khuyến mãi & tích điểm thưởng, chuẩn hóa dây chuyền CI/CD Node 24 + GHCR và bàn giao trên môi trường Production.

### 1. Tính năng mới & Nâng cấp Nghiệp vụ
- **Giỏ hàng & Tùy biến đồ uống (FR-05 $\rightarrow$ FR-11):**
  - Khách hàng chọn kích cỡ Size (`S`/`M`/`L`) và nhiều loại Topping; tính giá nhất quán giữa `apps/web/utils/pricing.ts` và `apps/api/src/common/utils/pricing.util.ts`.
  - Quản lý trạng thái giỏ hàng bằng Zustand Store (`apps/web/stores/cartStore.ts`) kèm Cart Badge đồng bộ trên `Header` và `BottomNav`.
- **Xác thực JWT & Phân quyền RBAC (FR-01, FR-02, NFR-03, NFR-04):**
  - Đăng ký, đăng nhập (`bcrypt` 10 rounds), cấp Bearer JWT qua `JwtAuthGuard` và kiểm soát quyền `CUSTOMER` / `BARISTA` / `ADMIN` bằng `RolesGuard` cùng lọc sở hữu tài nguyên theo `userId`.
- **Đặt đơn hàng & Cửa sổ thanh toán 10 phút (FR-12, NFR-10):**
  - Endpoint `POST /orders` sử dụng `prisma.$transaction`, khóa chống trùng lặp `Idempotency-Key` (`Order.checkoutKey`), kiểm soát tồn kho đồng thời (`Product.version` Optimistic Locking) và dịch vụ `OrderExpirationService` tự động hủy đơn hết hạn sau cửa sổ thanh toán **10 phút** (`ORDER_PAYMENT_WINDOW_MS`).
- **Cổng thanh toán đa chế độ (`PAYMENT_PROVIDER`: `VNPAY` & `MOCK`) (FR-13, FR-14, FR-15):**
  - Hỗ trợ đọc cấu hình động qua `GET /payments/config`.
  - Chế độ `VNPAY` Sandbox: `POST /payments/vnpay/create`, chữ ký HMAC-SHA512, xử lý `GET /payments/vnpay/return`, `GET /payments/vnpay/ipn`, đối soát `POST /payments/vnpay/reconcile` và xử lý ngoại lệ giao dịch đến chậm (*Delayed IPN callback*).
  - Chế độ `MOCK`: `POST /payments` thanh toán mô phỏng tức thì kèm bảo vệ `Idempotency-Key` (`Idempotent-Replayed: true`).
  - Lịch sử đơn hàng (`/orders`) và chi tiết đơn (`/orders/[id]`) hỗ trợ thanh toán lại (`ResumeVnpayPayment`).
- **Khuyến mãi (Voucher) & Điểm thưởng Loyalty (FR-16):**
  - `PromotionsModule`: `GET /promotions/vouchers`, `POST /promotions/apply` (`PERCENTAGE` có trần `maxDiscount` / `FIXED_AMOUNT`), tự động tích điểm `EARN` (10.000đ = 1 điểm) khi thanh toán thành công và đổi điểm `REDEEM` (`POST /promotions/redeem-points` với `REWARD10K`, `REWARD20K`, `REWARD50K`) tại `/UserProfile`.
- **Cổng Staff Portal (`/staff`), State Machine & Kho nguyên liệu (FR-17, ADR-003):**
  - Quản lý 7 trạng thái đơn chuẩn: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `COMPLETED` (và nhánh lỗi/hủy `PAYMENT_FAILED`, `CANCELLED`).
  - `InventoryModule`: Quản lý nguyên liệu (`Ingredient`), công thức pha chế theo size (`RecipeItem`), tự động khấu trừ nguyên liệu & đồng bộ `Product.stock`, ghi nhật ký biến động `IngredientAuditLog` và quy trình khách hủy đơn `PAID` tạo `RefundRequest` chờ `BARISTA`/`ADMIN` phê duyệt (`POST /orders/:id/approve-refund`).

### 2. Tự động hóa CI/CD, Container & Đồng bộ Tài liệu
- **Pipeline CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)):** Chạy trên **Node.js 24**, kiểm tra `oxlint --type-aware`, `npm test` (Backend), `eslint`, `npm run test:vnpay` (Frontend) và build cả Backend/Frontend.
- **Pipeline CD ([`.github/workflows/cd.yml`](../.github/workflows/cd.yml)):** Dây chuyền 4 giai đoạn trên **Node.js 24**:
  1. `1. Quality Gate (Lint & Test)` (PostgreSQL 16 service, `oxlint`, `jest`, `eslint`, `test:vnpay`).
  2. `2. Build Artifacts` (NestJS & Next.js production build).
  3. `3. Docker Image & Cloud Deployment`: Đóng gói multi-stage `node:24-alpine` (`apps/api/Dockerfile`, `apps/web/Dockerfile`), đăng nhập và push image `brewlite-api` & `brewlite-web` lên **GHCR** (`ghcr.io/dangtuan992006/swe_project_assignment2/*` theo commit SHA, `latest` và semver tag), sau đó kích hoạt deploy webhook.
  4. `4. Post-Deployment Smoke Test`: Vòng lặp kiểm tra nghiêm ngặt HTTP 200 (tối đa 60 giây chờ cold start, fail với `exit 1` nếu lỗi) cho `/health`, `/swagger`, Vercel Frontend và chạy `node tests/e2e-checkout.flow.mjs --smoke`.
- **Đồng bộ Đặc tả & Sơ đồ (17 FRs & 20 NFRs):** Cập nhật `SRS.md` (`1.0 Approved`), `context-and-scope.md`, `class-domain.{puml,md,svg}` (12 models, 9 enums), `deployment.{puml,svg}`, `traceability-matrix.md` và `README.md`.

### 3. Kiểm thử & Hạ tầng Production
- **Chất lượng kiểm thử đạt 100%:**
  - Backend Unit & Integration: **24 suites / 326 tests PASS** (`npm test` trong `apps/api`).
  - Backend NestJS E2E: **1 suite / 4 tests PASS** (`npm run test:e2e` trong `apps/api`).
  - Frontend Unit Tests: **28 / 28 tests PASS** (`npm run test:vnpay` trong `apps/web`).
  - Black-box E2E Runner & Integration: [`tests/e2e-checkout.flow.mjs`](../tests/e2e-checkout.flow.mjs) (**9/9 bước PASS** ở cả `MOCK` và `VNPAY`, kèm chế độ `--smoke` **4/4 PASS** trên Production) và [`tests/e2e-integration.spec.ts`](../tests/e2e-integration.spec.ts) (**2 suites / 6 tests PASS** qua `node --test`).
- **Môi trường Production Live:**
  - Frontend (Vercel): [https://swe-project-assignment2.vercel.app](https://swe-project-assignment2.vercel.app)
  - Backend API (Render): [https://brewlite-api-2tuk.onrender.com](https://brewlite-api-2tuk.onrender.com)
  - Health Check & Swagger: `/health` (HTTP 200), `/swagger`
- **Video Demo Trực quan (End-to-End):** [demo_brewlite.mp4 (Google Drive)](https://drive.google.com/file/d/12fDG-yzD5fEU9Z0vBaw2eAi5zGVFJLqj/view?usp=drivesdk)

---

## 📦 Phiên bản v1.0.0 — Sprint 1: Technical Foundation & MVP Menu Catalog
**Ngày phát hành:** 04/11/2026  
**Mốc Git Tag dự kiến:** `v1.0.0` (gắn trên cột mốc hoàn thiện nền tảng Sprint 1 trước khi mở rộng Sprint 2).  
**Trọng tâm Sprint 1:** Thiết lập nền tảng kỹ thuật Monorepo, quản lý phiên bản & tài liệu thiết kế hệ thống bằng Git, và xây dựng MVP đầu tiên chạy được cho luồng xem thực đơn đồ uống.

### 1. Tính năng cốt lõi (MVP Features)
- **Danh mục đồ uống trực tuyến (FR-03, US-01):**
  - Endpoint `GET /products` trả về danh sách đồ uống kèm hình ảnh, tên món, mô tả, giá bán và trạng thái tồn kho từ PostgreSQL.
  - Giao diện Web Next.js mobile-first hiển thị danh mục dạng lưới trực quan cùng đầy đủ trạng thái Loading, Empty và Error.
- **Xem chi tiết sản phẩm (FR-04, US-02):**
  - Endpoint `GET /products/:id` cung cấp thông tin chi tiết món, tùy chọn Size/Topping và kiểm tra tồn kho (`In Stock` / `Out of Stock`).
- **Dữ liệu mẫu & Khởi tạo CSDL:**
  - Prisma schema khởi tạo, migration và `prisma/seed.ts` nạp danh mục, sản phẩm mẫu.

### 2. Kiến trúc & Nền tảng Kỹ thuật
- **Cấu trúc Monorepo:** Tách biệt rõ ràng Backend NestJS (`apps/api/`), Frontend Next.js (`apps/web/`), Tài liệu thiết kế (`docs/`) và Kiểm thử (`tests/`).
- **Cơ sở dữ liệu:** Thiết lập PostgreSQL 16 chạy qua Docker Compose (`docker-compose.yml`), quản lý lược đồ dữ liệu và migration bằng Prisma ORM (`ADR-002`).
- **Tài liệu hóa thiết kế:** Hoàn thành `context-and-scope.md`, `SRS.md`, các sơ đồ UML (`usecase-overview`, `usecase-checkout`, `activity-checkout`, `sequence-checkout`, `class-domain`, `deployment`) và 03 bản ADR (`001-monorepo`, `002-orm-selection`, `003-state-machine`).
- **Tích hợp CI sơ khởi:** Thiết lập GitHub Actions (`.github/workflows/ci.yml`) chạy tự động `Lint`, `Unit Test` và `Build` trên các nhánh phát triển và Pull Request.
