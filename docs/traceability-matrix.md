# Ma trận truy vết yêu cầu (Traceability Matrix)

### 1. Quy ước định danh sơ đồ và tài liệu thiết kế

- **UseCase-01:** Sơ đồ use-case tổng quát (`docs/diagrams/usecase-overview.puml`)
- **Activity-01:** Sơ đồ hoạt động luồng đặt món & thanh toán (`docs/diagrams/activity-checkout.puml`)
- **Sequence-01:** Sơ đồ tuần tự luồng checkout trọng tâm (`docs/diagrams/sequence-checkout.puml`)
- **Class-01:** Sơ đồ lớp miền domain model (`docs/diagrams/class-domain.puml`)
- **Deployment-01:** Sơ đồ triển khai production (`docs/diagrams/deployment.puml`)
- **Architecture-01:** Tài liệu thiết kế kiến trúc hệ thống (`docs/architecture/README.md`)

### 2. Quy ước mã kiểm thử (Test Conventions)

- **UNIT-\*:** Unit Test kiểm thử logic nghiệp vụ nội bộ các Service (`apps/api/src/**/*.spec.ts`)
- **API-\*:** Controller / Endpoint Test kiểm thử hợp đồng API HTTP
- **INT-\*:** Integration Test kiểm thử tương tác Database, Transaction, Optimistic Locking, State Machine & Cổng thanh toán
- **E2E-\*:** End-to-End Test luồng nghiệp vụ hoàn chỉnh từ Auth đến Đặt hàng & Idempotency (`apps/api/test/app.e2e-spec.ts`)
- **UI-\*:** Client State / UI Test kiểm thử giỏ hàng Zustand và giao diện Next.js (`apps/web`)
- **SEC-\*:** Security Test kiểm thử phân quyền Role, Guard và Hashing mật khẩu bcrypt
- **SYS-\* / CI-CD-\* / DOC-\*:** Kiểm thử tải, cấu hình môi trường, static analysis (Lint/Typecheck), Docker và CI/CD Pipeline

---

### 3. Bảng ma trận truy vết (RTM)

| Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01** | UC-01 Đăng ký tài khoản | UseCase-01, Class-01 | `POST /auth/register` | `UNIT-AUTH-01` (`auth.service.spec.ts`), `E2E-AUTH-01` (`test/app.e2e-spec.ts`) |
| **FR-02** | UC-02 Đăng nhập và xác thực JWT | UseCase-01, Sequence-01 | `POST /auth/login`, `JwtAuthGuard` | `UNIT-AUTH-02` (`auth.service.spec.ts`), `E2E-AUTH-02` (`test/app.e2e-spec.ts`) |
| **FR-03** | US-01 Xem danh sách đồ uống | Activity-01, Class-01 | `GET /products` | `API-PROD-01` (`products.service.spec.ts`), `E2E-PROD-01` (`test/app.e2e-spec.ts`) |
| **FR-04** | US-02 Xem chi tiết sản phẩm | Activity-01, Class-01 | `GET /products/:id` | `API-PROD-02` (`products.service.spec.ts`) |
| **FR-05** | US-03 Lựa chọn size và topping | Activity-01, Class-01 | Next.js `ProductOptions` | `UI-CART-01` (`apps/web/stores/cartStore.ts`), `UNIT-ORD-01` (`order-lines.spec.ts`) |
| **FR-06** | US-04 Thêm sản phẩm vào giỏ hàng | Activity-01, Class-01 | Zustand `CartStore (addItem)` | `UI-CART-02` (`apps/web/stores/cartStore.ts`) |
| **FR-07** | US-05 Xem giỏ hàng | Activity-01, Class-01 | Next.js `CartPage` | `UI-CART-03` (`apps/web/stores/cartStore.ts`) |
| **FR-08** | US-06 Cập nhật số lượng trong giỏ | Activity-01, Class-01 | Zustand `CartStore (updateQty)` | `UI-CART-04` (`apps/web/stores/cartStore.ts`) |
| **FR-09** | US-07 Xóa sản phẩm khỏi giỏ hàng | Activity-01, Class-01 | Zustand `CartStore (removeItem)` | `UI-CART-05` (`apps/web/stores/cartStore.ts`) |
| **FR-10** | US-08 Tự động tính tổng tiền giỏ hàng | Activity-01, Class-01 | Zustand `CartStore (calcTotal)` | `UI-CART-06` (`apps/web/stores/cartStore.ts`), `UNIT-ORD-02` (`order-lines.spec.ts`) |
| **FR-11** | US-09 Hiển thị số lượng trên Cart Badge | Activity-01, Class-01 | Next.js `CartBadge` | `UI-CART-07` (`apps/web/stores/cartStore.ts`) |
| **FR-12** | UC-03 Đặt hàng từ giỏ hàng | Activity-01, Sequence-01, Class-01 | `POST /orders` | `INT-ORD-01` (`orders.service.spec.ts`), `E2E-ORD-01` (`test/app.e2e-spec.ts`) |
| **FR-13** | UC-04 Thanh toán không tiền mặt | Sequence-01, Class-01 | `POST /payments`, `apps/api/prisma/schema.prisma` (Payment) | `INT-PAY-01` (`payments.service.spec.ts`), `INT-PAY-02` (`vnpay-checkout.service.spec.ts`) |
| **FR-14** | US-10 Hiển thị xác nhận đơn hàng | Activity-01, Sequence-01 | Next.js `OrderConfirmPage` | `E2E-FLOW-01` (`test/app.e2e-spec.ts`), `INT-SM-01` (`order-state-machine.spec.ts`) |
| **FR-15** | US-11 Xem lịch sử đơn hàng | UseCase-01, Class-01 | `GET /orders/me` | `API-ORD-01` (`orders.controller.spec.ts`), `INT-ORD-02` (`orders.service.spec.ts`) |
| **FR-16** | UC-05 Áp dụng mã khuyến mãi | Class-01 | `apps/api/prisma/schema.prisma` (Voucher), `apps/api/prisma/seed.ts` | `UNIT-PROM-01` (`promotions.service.spec.ts`) |
| **NFR-01** | NFR-01 Thời gian phản hồi API (< 500ms) | Deployment-01, Architecture-01 | NestJS Core, PostgreSQL Indexing | `SYS-PERF-01` (`health.controller.spec.ts`) |
| **NFR-02** | NFR-02 Khả năng xử lý tải | Deployment-01, Architecture-01 | PostgreSQL Connection Pool | `SYS-LOAD-01` (`test-environment.spec.ts`) |
| **NFR-03** | NFR-03 Xác thực JWT bắt buộc | Sequence-01, Architecture-01 | `JwtStrategy`, `PassportModule` | `SEC-AUTH-01` (`auth.service.spec.ts`), `E2E-AUTH-03` (`test/app.e2e-spec.ts`) |
| **NFR-04** | NFR-04 Phân quyền truy cập tài nguyên | Sequence-01, Architecture-01 | `UserOwnershipGuard`, `RolesGuard` | `SEC-RBAC-01` (`roles.guard.spec.ts`) |
| **NFR-05** | NFR-05 Bảo vệ mật khẩu (bcrypt) | Class-01 | `bcrypt.hash` trong `AuthService` | `SEC-HASH-01` (`auth.service.spec.ts`) |
| **NFR-06** | NFR-06 Quản lý biến môi trường bí mật | Deployment-01 | `ConfigModule`, `.env.example` | `SYS-CONF-01` (`payment-configuration.spec.ts`) |
| **NFR-07** | NFR-07 Kiểm tra dữ liệu đầu vào và lỗi | Sequence-01 | `ValidationPipe`, `class-validator` DTO | `INT-VAL-01` (`orders.controller.spec.ts`), `E2E-VAL-01` (`test/app.e2e-spec.ts`) |
| **NFR-08** | NFR-08 Phản hồi giao diện (Loading, Error) | Activity-01 | Next.js UI State Components | `UI-STATE-01` (`apps/web` build verification) |
| **NFR-09** | NFR-09 Xử lý ngoại lệ tập trung | Sequence-01, Architecture-01 | `AllExceptionsFilter` | `SYS-ERR-01` (`test-environment.spec.ts`), `E2E-ERR-01` (`test/app.e2e-spec.ts`) |
| **NFR-10** | NFR-10 Tính nhất quán dữ liệu đơn hàng | Sequence-01 | Database Transaction, `apps/api/prisma/schema.prisma` (version) | `INT-TX-01` (`fulfill-paid-order.spec.ts`), `INT-SM-02` (`order-state-machine.spec.ts`) |
| **NFR-11** | NFR-11 Khôi phục dữ liệu sau sự cố | Deployment-01 | Docker Volume (`postgres_data`) | `SYS-VOL-01` (`docker-compose.yml` volume mount) |
| **NFR-12** | NFR-12 Cấu trúc phân lớp module rõ ràng | Architecture-01 | `apps/api/src`, `apps/web/app` | `SYS-ARCH-01` (`app.controller.spec.ts`) |
| **NFR-13** | NFR-13 Tính nhất quán định dạng mã nguồn | Architecture-01 | `.prettierrc`, `.oxlintrc.json` | `SYS-LINT-01` (`pnpm oxlint`, `prettier --check`) |
| **NFR-14** | NFR-14 Kiểm thử chức năng trọng yếu | Architecture-01 | Jest Unit, Integration, E2E Test | `TEST-SUITE-01` (Jest runner: 24 suites, 326 tests pass) |
| **NFR-15** | NFR-15 Đóng gói môi trường bằng Docker | Deployment-01 | `Dockerfile`, `docker-compose.yml` | `SYS-DOCK-01` (`docker compose config` validation) |
| **NFR-16** | NFR-16 Cấu hình tách biệt theo môi trường | Deployment-01 | `ConfigService` (local vs production) | `SYS-ENV-01` (`payment-configuration.spec.ts`) |
| **NFR-17** | NFR-17 Hướng dẫn vận hành hệ thống | Architecture-01 | `README.md` | `DOC-VERIF-01` (`README.md` deployment walkthrough) |
| **NFR-18** | NFR-18 Tương thích trình duyệt và Mobile | Deployment-01 | Next.js PWA, TailwindCSS | `UI-RESP-01` (`apps/web` responsive viewport verification) |
| **NFR-19** | NFR-19 Luồng thao tác trực quan | Activity-01 | Next.js App Router Flow | `E2E-FLOW-02` (`test/app.e2e-spec.ts`) |
| **NFR-20** | NFR-20 Triển khai liên tục (CD) lên Cloud | Deployment-01 | `.github/workflows/ci.yml`, `.github/workflows/cd.yml` | `CI-CD-01` (GitHub Actions workflow validation) |

---

## 4. Rà soát tính nhất quán (Consistency check)

1. **Tính nhất quán về thực thể dữ liệu:** Các thực thể trong `Class-01` (`class-domain.puml` & `class-domain.md`) bao phủ đầy đủ các thực thể được đặc tả trong SRS: `User`, `Product`, `Order`, `OrderDetail` (ánh xạ sang model `OrderItem` / bảng `order_items` trong Prisma), `Payment`, `Voucher` (tương ứng khái niệm `Promotion` trong đề bài) và `LoyaltyTransaction`.
2. **Tính nhất quán về trạng thái đơn hàng:** Máy trạng thái (Order State Machine) trong SRS, `ADR-003`, `use-case-checkout.md`, `Activity-01` và `Sequence-01` (`sequence-checkout.puml`) đều thống nhất sử dụng 7 trạng thái chuẩn: `PENDING`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `PAYMENT_FAILED`, `CANCELLED`.
3. **Tính nhất quán về tham số nghiệp vụ:** Header `Idempotency-Key` chống thanh toán trùng và cơ chế kiểm soát tồn kho đồng thời (optimistic locking trừ kho khi đơn chuyển sang `PAID`) trong SRS được phản ánh thống nhất trong luồng xử lý của `Sequence-01`, `Activity-01` và `ADR-003`.
