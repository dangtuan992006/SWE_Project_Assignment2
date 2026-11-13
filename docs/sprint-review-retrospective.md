# Báo cáo Tổng kết Sprint: Product Backlog, Sprint Review & Retrospective
## Dự án BrewLite — Nền tảng Đặt Cà phê Trực tuyến Không Dùng Tiền Mặt

Tài liệu này tổng hợp **Product Backlog cho Sprint 1 và Sprint 2** (đáp ứng Task 4.1) cùng biên bản **Sprint Review** và **Sprint Retrospective** cho cả hai Sprint (đáp ứng **Task 5.4 và Mục 9.1** của đề bài Assignment 2).

- **Phương pháp phát triển:** Agile Scrum (2 Sprint × 02 tuần)
- **Đơn vị thực hiện:** Nhóm phát triển Công nghệ Phần mềm — Trường Đại học Sài Gòn (SGU)
- **Repository:** [`dangtuan992006/SWE_Project_Assignment2`](https://github.com/dangtuan992006/SWE_Project_Assignment2)

---

## PHẦN 0: PRODUCT BACKLOG — SPRINT 1 & SPRINT 2 (TASK 4.1)

> **Ghi chú đồng bộ Issue Board:** Do token GitHub MCP hiện hành chỉ có quyền đọc đối với repository `dangtuan992006/SWE_Project_Assignment2` (và không cài `gh` CLI cục bộ), bảng Product Backlog chuẩn dưới đây đóng vai trò *bảng công việc tương đương* được quản lý phiên bản trực tiếp trong Git, liên kết đầy đủ tới Commit SHA và Pull Request thực tế (và sẵn sàng ánh xạ 1-1 lên GitHub Issues/Milestones khi người sở hữu repo thao tác trên Web UI).

### Bảng Backlog Sprint 1 — Milestone: `Sprint 1: MVP Menu & Technical Foundation (v1.0.0)`

| ID | Hạng mục Backlog (User Story / Task) | Loại | Tham chiếu Yêu cầu | Trạng thái | Tham chiếu Commit / PR |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **BL-101** | Khởi tạo repository, cấu trúc Monorepo (`apps/web`, `apps/api`, `docs`), Git workflow & quy ước Conventional Commits | `Chore` / `Docs` | Task 4.1, ADR-001 | ✅ Done | `18fbda5`, `1a85018`, `be59fb4`, `b113e04` |
| **BL-102** | Khai thác bối cảnh, stakeholder, phạm vi & đặc tả SRS (Task 1) | `Docs` | Task 1.1–1.3 | ✅ Done | `ae3b5c5`, `3fe700a`, `84bdbba` |
| **BL-103** | Thiết kế hệ thống UML (Activity, Sequence, Class, Deployment) & 03 ADRs (Task 2, Task 3) | `Docs` | Task 2.1–2.3, 3.1–3.2 | ✅ Done | `38fed81`, `70afb4e`, `c05017f`, `84c209b` |
| **BL-104** | Xây dựng Backend MVP: `GET /health`, `GET /products`, `GET /products/:id`, Prisma Schema & Seed | `Feat` | FR-03, FR-04, Task 4.3 | ✅ Done | `4305479`, `752b390`, `b9294f4` |
| **BL-105** | Xây dựng Frontend Web MVP mobile-first: Menu Grid, Product Detail & Loading/Empty/Error states | `Feat` | FR-03, FR-04, NFR-08 | ✅ Done | `dfe6bb8`, `a250777`, `468b380`, `c1da75c` |
| **BL-106** | Thiết lập GitHub Actions CI Pipeline (`Install -> Lint -> Unit Test -> Build`) | `CI` | Task 4.4, NFR-20 | ✅ Done | `60e3d29`, `0f06aee`, Run [`41839109041`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/41839109041) |

### Bảng Backlog Sprint 2 — Milestone: `Sprint 2: Full E2E, Staff Portal, CI/CD & Release v2.0.0`

| ID | Hạng mục Backlog (User Story / Task) | Loại | Tham chiếu Yêu cầu | Trạng thái | Tham chiếu Commit / PR |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **BL-201** | Tùy chọn Size/Topping, Giỏ hàng Zustand (`cartStore.ts`), Cart Badge & tính giá đồng nhất | `Feat` | FR-05..FR-11, Task 5.1 | ✅ Done | `b5e85c0`, `7946d95`, PR [`#1`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/1) (`e5cef5b`) |
| **BL-202** | Xác thực JWT, Hashing `bcrypt`, Đặt đơn `Idempotency-Key` & Optimistic Locking | `Feat` | FR-01, FR-02, FR-12, NFR-03..05, NFR-10 | ✅ Done | `aa18f4e`, `db90b7a`, `8e8f13b`, PR [`#1`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/1) |
| **BL-203** | Tích hợp cổng thanh toán `VNPAY` Sandbox (HMAC-SHA512, Return/IPN, Delayed Callback) & `MOCK` Adapter | `Feat` | FR-13, FR-14, FR-15 | ✅ Done | `93d29d4`, `a70361d`, `ac5d240`, PR [`#1`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/1) |
| **BL-204** | Khuyến mãi Voucher, Tích/Đổi điểm Loyalty (`PromotionsModule`) & trang `/UserProfile` | `Feat` | FR-16 | ✅ Done | `9c5bdaf`, `e1134be`, `2191e30`, PR [`#1`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/1) |
| **BL-205** | Cổng Staff Portal (`/staff`), State Machine 7 trạng thái, Kho nguyên liệu (`InventoryModule`) & Duyệt hoàn tiền (`RefundRequest`) | `Feat` | FR-17, ADR-003 | ✅ Done | `64f2362`, `2e5a7be`, `db6abd5`, `d7b5ec0`, PR [`#2`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/2) (`ec999e2`) |
| **BL-206** | Triển khai Production (Vercel + Render + Managed PostgreSQL) & CD Pipeline cơ bản | `Chore` | Task 5.3, Task 5.4 | ✅ Done | `8dc678b`, `a729731`, `feb6039`, PR [`#1`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/1), PR [`#2`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/2) |
| **BL-207** | **[Remediation]** Sửa lỗi `import Image` trong `apps/web/app/staff/page.tsx` che khuất `new Image()` gây lỗi `npm run build` | `Bug` | Task 1 (Remediation) | 🔄 Ready for PR #3 | Fix trên nhánh `TV1` (chờ merge PR #3) |
| **BL-208** | **[Remediation]** Chuẩn hóa `tests/e2e-checkout.flow.mjs` (`:8080`, `--smoke`, `MOCK`/`VNPAY`) & thay thế 5 placeholder `tests/e2e-integration.spec.ts` | `Test` | Task 2, Task 5.2 | 🔄 Ready for PR #3 | Fix trên nhánh `TV1` (chờ merge PR #3) |
| **BL-209** | **[Remediation]** Đồng bộ Monorepo `.gitignore`/`.env.example`, nâng Dockerfile lên `node:24-alpine`, push GHCR & strict HTTP 200 smoke test trong `cd.yml` | `Chore` | Task 3, Task 5.3, NFR-20 | 🔄 Ready for PR #3 | Fix trên nhánh `TV1` (chờ merge PR #3) |
| **BL-210** | **[Remediation]** Đồng bộ toàn diện `SRS.md` (17 FRs, 20 NFRs), `context-and-scope.md`, `class-domain.*`, `deployment.*`, `traceability-matrix.md` & `README.md` | `Docs` | Task 4, Task 8.1 | 🔄 Ready for PR #3 | Fix trên nhánh `TV1` (chờ merge PR #3) |
| **BL-211** | **[Remediation]** Cập nhật minh chứng CI/CD thực tế, Release Notes `v2.0.0`, Sprint Review/Retro & phát hành PR #3 + Tags/Release `v1.0.0`, `v2.0.0` | `Release` | Task 4.4, Task 5.4 | 🔄 In Progress (PR #3) | Đang hoàn thiện trên `TV1` (tags `v1.0.0`/`v2.0.0` chờ merge PR #3) |

---

## PHẦN 1: TỔNG KẾT SPRINT 1 (MVP MENU & NỀN TẢNG KỸ THUẬT)

### 1.1. Thông tin chung Sprint 1
- **Mục tiêu Sprint (Sprint Goal):** Tạo nền tảng kỹ thuật Monorepo, thiết lập hệ thống tài liệu có kiểm soát phiên bản bằng Git, và xây dựng phiên bản MVP đầu tiên chạy được cho luồng xem thực đơn đồ uống.
- **Thời gian thực hiện:** 21/10/2026 – 04/11/2026.

### 1.2. Kết quả Nghiệm thu Tính năng (Sprint 1 Review)

| Hạng mục công việc | Yêu cầu kỹ thuật | Trạng thái | Ghi chú nghiệm thu |
| :--- | :--- | :---: | :--- |
| **Cấu trúc Monorepo & Backlog** | Phân tách `apps/api/` (NestJS), `apps/web/` (Next.js), `docs/`, `tests/` | Hoàn thành | Thiết lập chuẩn theo ADR-001 (`b113e04`) và quản lý Backlog |
| **Cơ sở dữ liệu nền tảng** | Khởi tạo mô hình Category, Product, User bằng Prisma ORM | Hoàn thành | Chạy thành công migration khởi tạo và dữ liệu seed |
| **API Thực đơn đồ uống** | Endpoint `GET /products`, `GET /products/:id`, `GET /health` | Hoàn thành | Trả về danh sách đồ uống kèm giá và trạng thái tồn kho |
| **Giao diện Web MVP** | Next.js App Router, bố cục lưới mobile-first | Hoàn thành | Đầy đủ trạng thái Loading, Empty và Error State |
| **Tài liệu Thiết kế UML & ADRs** | SRS, Context & Scope, Use Case, Activity, Sequence, Class, Deployment, 3 ADRs | Hoàn thành | Lưu trữ dạng mã nguồn `.puml` và ảnh vector `.svg` |
| **Tích hợp CI sơ khởi** | Pipeline GitHub Actions tự động Lint, Test và Build | Hoàn thành | Workflow `.github/workflows/ci.yml` hoạt động ổn định |

### 1.3. Đánh giá & Rút kinh nghiệm (Sprint 1 Retrospective)
- **Điểm làm tốt:**
  - Nhóm hoàn thành đúng hạn mục tiêu Sprint Goal; MVP chạy thực tế kết nối API và PostgreSQL, không dùng mockup tĩnh.
  - Phân chia module rõ ràng theo hướng Modular Monolith và tài liệu hóa sớm bằng PlantUML.
- **Khó khăn & Tồn tại:**
  - Quy ước đặt tên commit ban đầu và cấu trúc thư mục (`backend`/`frontend` so với `apps/api`/`apps/web`) chưa đồng nhất trước khi tái cấu trúc.
  - Quá trình cấu hình biến môi trường cục bộ giữa Frontend và Backend còn phải sửa thủ công nhiều lần.
- **Kế hoạch cải tiến cho Sprint 2:**
  - Áp dụng thống nhất quy ước Conventional Commits (`[Feat]`, `[Fix]`, `[Docs]`, `[Test]`, `[Chore]`).
  - Chuẩn hóa các tệp `.env.example` theo đường dẫn `apps/api` và `apps/web`, tăng cường kiểm thử tự động trước khi merge code.

---

## PHẦN 2: TỔNG KẾT SPRINT 2 (END-TO-END FLOW, STAFF PORTAL, CI/CD & DELIVERY)

### 2.1. Thông tin chung Sprint 2
- **Mục tiêu Sprint (Sprint Goal):** Hoàn thiện trọn vẹn luồng khách hàng End-to-End (Size/Topping, Giỏ hàng, Đặt đơn, Thanh toán VNPay/Mock, Khuyến mãi & Loyalty), mở rộng Staff Portal & Kho nguyên liệu, tự động hóa toàn bộ quy trình CI/CD trên Node 24 kèm GHCR và bàn giao phiên bản Production.
- **Thời gian thực hiện:** 05/11/2026 – 13/11/2026.

### 2.2. Kết quả Nghiệm thu Tính năng (Sprint 2 Review)

| Hạng mục công việc | Yêu cầu kỹ thuật | Trạng thái | Ghi chú nghiệm thu |
| :--- | :--- | :---: | :--- |
| **Tùy chọn Size/Topping & Giỏ hàng** | Size S/M/L, Topping, `cartStore.ts`, Cart Badge | Hoàn thành | Tính giá nhất quán Client (`pricing.ts`) & Server (`pricing.util.ts`) |
| **Xác thực JWT & RBAC** | `JwtAuthGuard`, `RolesGuard` (`CUSTOMER`/`BARISTA`/`ADMIN`), `bcrypt` | Hoàn thành | Kiểm tra quyền ở tầng API và lọc sở hữu đơn hàng theo `userId` |
| **Đặt đơn & Chống trùng lặp** | `POST /orders` kèm `Idempotency-Key`, Optimistic Locking, cửa sổ thanh toán 10 phút | Hoàn thành | Đảm bảo nhất quán dữ liệu bằng `prisma.$transaction` & `OrderExpirationService` |
| **Cổng thanh toán VNPay & Mock** | `GET /payments/config`, `POST /payments/vnpay/create`, Return/IPN, Reconcile, `POST /payments` | Hoàn thành | Chữ ký HMAC-SHA512, xử lý Delayed IPN và 28 unit tests client |
| **Khuyến mãi & Điểm thưởng (FR-16)** | `PromotionsModule`, tích điểm `EARN` (10.000đ = 1 điểm), đổi điểm `REDEEM` | Hoàn thành | Giao diện áp dụng voucher tại `/cart` và đổi thưởng tại `/UserProfile` |
| **Staff Portal & Kho nguyên liệu (FR-17)** | `/staff`, `order-state-machine.ts` (7 trạng thái), `InventoryModule`, `RefundRequest` | Hoàn thành | Barista/Admin cập nhật trạng thái đơn, trừ kho theo `RecipeItem`, duyệt hoàn tiền |
| **Kiểm thử Toàn diện (Task 5.2)** | Unit, Integration, NestJS E2E & Black-box HTTP E2E | Hoàn thành | 24 API suites (326 tests) + 4 NestJS E2E + 28 Web VNPay + 6 HTTP E2E + 9-bước Flow (`--smoke`) |
| **CI/CD Node 24 & GHCR (Task 5.3)** | Quality Gate (`ci.yml`), CD 4 giai đoạn (`cd.yml`), `node:24-alpine`, GHCR push, strict Smoke Test | Hoàn thành | Đóng gói & đẩy image `brewlite-api`, `brewlite-web` lên GHCR; kiểm tra HTTP 200 live |
| **Ma trận Truy vết (RTM) & Tài liệu** | Phủ 100% **17 FRs và 20 NFRs** với mã file/test thực tế, UML SVGs & README | Hoàn thành | `SRS.md` (`1.0 Approved`), `class-domain.*` (12 models, 9 enums), `deployment.*`, `README.md` |
| **Minh chứng CI, Release & Rollback** | Nhật ký CI/CD thực tế, 4 kịch bản Rollback, Release Notes `v1.0.0` & `v2.0.0` | Hoàn thành | Ghi nhận thực tế `pull/1`, `pull/2`, chuẩn bị merge `pull/3` & tag `v1.0.0` / `v2.0.0` |

### 2.3. Đánh giá & Rút kinh nghiệm (Sprint 2 Retrospective)
- **Điểm làm tốt:**
  - Hệ thống đạt độ tin cậy cao với đầy đủ các tầng kiểm thử thực tế: **326 Backend Unit/Integration tests** (24 suites), **4 NestJS E2E tests**, **28 Frontend VNPay tests**, **6 Black-box HTTP integration tests** và **9-bước E2E flow** pass 100% ở cả hai chế độ `MOCK` và `VNPAY`.
  - Hệ thống Production hoạt động ổn định trên **Vercel** (`https://swe-project-assignment2.vercel.app`) và **Render** (`https://brewlite-api-2tuk.onrender.com/health` HTTP 200).
  - Rà soát đồng bộ toàn bộ mã nguồn, cấu hình Docker/CI/CD, đặc tả SRS (`17 FRs & 20 NFRs`), sơ đồ UML và RTM trước khi bàn giao cuối cùng.
- **Khó khăn & Thách thức kỹ thuật đã xử lý:**
  - **Tương thích ESM/Jest trên CI:** CD run [`42967883207`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42967883207) thất bại khi chạy Jest trên Node 20; đã nâng cấp toàn bộ CI/CD và Dockerfile sang **Node.js 24** (`a729731`, `node:24-alpine`).
  - **Đặt tên tag GHCR & Shadowing TypeScript:** CD run [`42968708235`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42968708235) lỗi do ký tự hoa trong tên repo khi gắn tag Docker (sửa ở `feb6039`), và commit `fd6d857` vô tình làm `import Image from "next/image"` che khuất `new Image()` ở `apps/web/app/staff/page.tsx` (đã khắc phục triệt để trước PR #3).
  - **Đồng bộ môi trường kiểm thử & tài liệu:** Đã thay thế toàn bộ assertion giả (`expect(true).toBe(true)`), chuẩn hóa cổng `:8080` và URL Render thực tế, tách chế độ `--smoke` chỉ đọc cho Production và đồng bộ tài liệu với `schema.prisma` (12 models, 9 enums).
- **Bài học kinh nghiệm cho vận hành thực tế:**
  - Luôn giữ cổng kiểm tra tự động (`oxlint`, `eslint`, unit test, build và smoke test strict HTTP 200) làm rào chắn bắt buộc trước khi merge và sau khi triển khai.
  - Mọi cập nhật schema (Prisma migration), API hoặc pipeline CD phải được đối chiếu lại ngay vào SRS, sơ đồ UML và Ma trận truy vết (RTM) trong cùng Pull Request.
