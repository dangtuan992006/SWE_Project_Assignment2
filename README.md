# BrewLite — Ứng dụng đặt cà phê không dùng tiền mặt

> **Đồ án môn học:** Công nghệ Phần mềm (Software Engineering) — Trường Đại học Sài Gòn (SGU)  
> **Phương pháp phát triển:** Agile Scrum  
> **Phiên bản:** Assignment 2: Requirements to Deployment (Khai thác Yêu cầu, Thiết kế Kiến trúc, CI/CD & Bàn giao)

---

## 1. Giới thiệu tổng quan

**BrewLite** là ứng dụng đặt cà phê trực tuyến không dùng tiền mặt (Cashless Coffee Ordering), giải quyết bài toán ùn tắc tại quầy thanh toán vào giờ cao điểm, tối ưu hóa quy trình pha chế của nhân viên Barista và nâng cao trải nghiệm đặt nước của khách hàng.

### Ngăn xếp công nghệ cốt lõi:
- **Frontend (Web):** Next.js (React 19, TypeScript, TailwindCSS) — Thiết kế Mobile-first, hỗ trợ PWA.
- **Backend (API):** NestJS (TypeScript) — Kiến trúc Modular Monolith, RESTful API.
- **Cơ sở dữ liệu:** PostgreSQL 16+ kết hợp **Prisma ORM** và cơ chế Migration tự động.
- **Đóng gói & Triển khai:** Docker & Docker Compose, sẵn sàng cho môi trường đám mây PaaS (Render / Railway / Vercel).

---

## 2. Cấu trúc Repository (Monorepo)

Dự án áp dụng mô hình **Monorepo** chuẩn hóa cấu trúc theo quy định tại Mục 9 của đề bài Assignment 2 và [ADR-001](docs/architecture/adr/001-monorepo.md):

```text
SWE_Project_Assignment2/
├── apps/
│   ├── api/                  # Dịch vụ Backend NestJS & Cấu hình Database
│   │   ├── src/              # Mã nguồn ứng dụng (Modules, Controllers, Services)
│   │   ├── test/             # Kịch bản kiểm thử (E2E & Integration tests)
│   │   ├── .env.example      # Biến môi trường mẫu Backend
│   │   └── package.json
│   └── web/                  # Ứng dụng Frontend Web / PWA Next.js
│       ├── app/              # App Router (Trang giao diện, Layouts, Components)
│       ├── public/           # Tài nguyên tĩnh (Hình ảnh, Icons)
│       ├── .env.example      # Biến môi trường mẫu Frontend
│       └── package.json
├── docs/                     # Toàn bộ tài liệu kỹ thuật & Thiết kế hệ thống
│   ├── requirements/         # Task 1: Bối cảnh, Phạm vi & Đặc tả yêu cầu (SRS)
│   │   ├── context-and-scope.md
│   │   └── SRS.md
│   ├── diagrams/             # Task 2: Các sơ đồ UML (PlantUML nguồn & ảnh SVG)
│   │   ├── activity-checkout.*   # Task 2.1: Activity Diagram
│   │   ├── sequence-checkout.*   # Task 2.2: Sequence Diagram (5 lifelines)
│   │   ├── class-domain.*        # Task 2.3: Domain Class Diagram & Data Dictionary
│   │   ├── deployment.*          # Task 3.2: Deployment Diagram Production
│   │   ├── usecase-overview.*    # Sơ đồ Use-case tổng quan toàn hệ thống
│   │   └── use-case-checkout.*   # Task 1.3: Đặc tả use-case trọng tâm
│   ├── architecture/         # Task 3.1: Kiến trúc hệ thống & Hồ sơ quyết định (ADR)
│   │   ├── README.md         # Chi tiết kiến trúc hệ thống
│   │   └── adr/              # ADR-001 (Monorepo), ADR-002 (Prisma), ADR-003 (State Machine)
│   ├── deployment.md         # Hướng dẫn chi tiết vận hành & triển khai Production
│   ├── Huong-dan-cau-hinh-VNPAY.md # Hướng dẫn cấu hình và chạy thử VNPay Sandbox
│   ├── Kiem-tra-migration-VNPAY.md # Đối chiếu và kiểm tra migration VNPay
│   └── traceability-matrix.md# Task 8.1: Ma trận truy vết bắt buộc (15 FRs & 19 NFRs)
├── tests/                    # Task 5.2 & Mục 9: Kịch bản kiểm thử tích hợp E2E
│   ├── README.md             # Hướng dẫn chi tiết & bảng ánh xạ ca kiểm thử
│   ├── e2e-checkout.flow.mjs # Runner kiểm thử tự động toàn bộ luồng người dùng
│   └── e2e-integration.spec.ts # Kịch bản kiểm thử Jest BDD
├── .github/workflows/        # Task 4.4 & 5.3: CI/CD Pipelines (ci.yml, cd.yml)
├── docker-compose.yml        # Khởi chạy PostgreSQL, Backend API và Frontend Web
└── README.md                 # Tài liệu hướng dẫn chính của dự án
```

---

## 3. Tổng quan Kiến trúc Hệ thống

### 3.1. Bối cảnh Hệ thống (System Context)

```mermaid
flowchart LR
    Customer[Khách hàng] --> Browser[Trình duyệt / PWA]
    Browser --> FE[Next.js Frontend]
    FE --> API[NestJS REST API]
    API --> DB[(PostgreSQL Database)]
    API --> Pay[Mock Payment Adapter]

    Staff[Nhân viên Barista - Pha chế]
    Admin[Quản lý cửa hàng / PO]
```

### 3.2. Góc nhìn Triển khai Thành phần (Component Deployment)

```mermaid
flowchart TB
    Client[Trình duyệt / PWA] -->|HTTPS :443| FE[Next.js Web Service / CDN]
    FE -->|HTTPS REST :443 -> :8080| BE[NestJS API Service]
    BE -->|TLS / Mạng nội bộ :5432| DB[(PostgreSQL + Persistent Storage)]
    BE -->|HTTPS| Pay[Mock Payment Gateway]
```

### 3.3. Định hướng Backend: Modular Monolith
Backend NestJS được tổ chức thành các Module nghiệp vụ phân định ranh giới rõ ràng:
- **Auth Module:** Quản lý đăng ký, đăng nhập, xác thực JWT (`JwtAuthGuard`) và băm mật khẩu (`bcrypt`).
- **Users Module:** Thông tin người dùng, phân quyền RBAC (`Role`) và tích lũy điểm thưởng (`loyaltyPoints`).
- **Products Module:** Danh mục đồ uống, tùy chọn size, topping, giá bán và số lượng tồn kho (`stock`).
- **Orders Module:** Tạo đơn hàng, tự động tính tổng tiền ở phía server, kiểm soát đồng thời (Optimistic Locking) và máy trạng thái đơn hàng ([ADR-003](docs/architecture/adr/003-state-machine.md)).
- **Payments Module:** Tích hợp cổng thanh toán mô phỏng (Mock Payment) cho Ví điện tử / Thẻ, bảo vệ giao dịch bằng khóa `Idempotency-Key`.
- **Common Module:** Cung cấp `PrismaService` dùng chung, bộ lọc ngoại lệ toàn cục, logging có cấu trúc và endpoint kiểm tra sức khỏe `GET /health`.

### 3.4. Vòng đời Trạng thái Đơn hàng (Order State Machine)
Đơn hàng được quản lý chặt chẽ qua **7 trạng thái chuẩn mực**:
- **Luồng thành công:** `PENDING` → `PAID` → `PREPARING` → `READY` → `COMPLETED`
- **Luồng lỗi / Thử lại:** `PENDING` → `PAYMENT_FAILED` ↔ `PENDING` *(hoặc rẽ nhánh sang `CANCELLED`)*
- **Trạng thái kết thúc:** `COMPLETED` *(Hoàn tất)* và `CANCELLED` *(Hủy đơn)*

---

## 4. Danh mục Quyết định Kiến trúc (ADR)

Mọi quyết định kỹ thuật cốt lõi đều được thảo luận và chính thức thông qua:
1. **[ADR-001: Tổ chức Repository theo mô hình Monorepo](docs/architecture/adr/001-monorepo.md)** — *Accepted*
2. **[ADR-002: Lựa chọn lớp truy cập dữ liệu Prisma ORM & Migration](docs/architecture/adr/002-orm-selection.md)** — *Accepted*
3. **[ADR-003: Quy định chuyển trạng thái đơn hàng (State Machine)](docs/architecture/adr/003-state-machine.md)** — *Accepted*

---

## 5. Hướng dẫn Cài đặt & Khởi chạy Cục bộ (Local Development)

### 5.1. Yêu cầu Tiên quyết
- **Node.js:** Phiên bản 20.x hoặc 24.x LTS.
- **Docker & Docker Compose:** Dùng để chạy cơ sở dữ liệu PostgreSQL.
- **Git:** Quản lý mã nguồn.

### 5.2. Khởi động Cơ sở dữ liệu PostgreSQL
Khởi chạy container PostgreSQL nền tảng bằng Docker Compose:
```bash
docker compose up -d db
```
Cơ sở dữ liệu sẽ chạy trên cổng `5432` kèm vùng lưu trữ bền vững `pgdata`.

### 5.3. Cài đặt & Chạy Backend API (NestJS)
```bash
cd apps/api
npm install
copy .env.example .env    # Trên Linux/macOS: cp .env.example .env
npm run prisma:seed      # Nạp dữ liệu danh mục, đồ uống, voucher và tài khoản test
npm run start:dev
```
- API chạy tại: `http://localhost:8080`
- Kiểm tra sức khỏe: `GET http://localhost:8080/health`
- Tài liệu Swagger: `http://localhost:8080/swagger`

### 5.4. Cài đặt & Chạy Frontend Web (Next.js)
Mở một terminal mới:
```bash
cd apps/web
npm install
copy .env.example .env    # Trên Linux/macOS: cp .env.example .env
npm run dev
```
- Giao diện người dùng chạy tại: `http://localhost:3000`

### 5.5. Chạy Kiểm thử Hệ thống (Unit, Integration & E2E)
- **Kiểm thử Unit & Integration (326 tests pass 100%):**
  ```bash
  cd apps/api
  pnpm test
  ```
- **Kiểm thử E2E nội bộ NestJS:**
  ```bash
  cd apps/api
  pnpm test:e2e
  ```
- **Kiểm thử tích hợp luồng E2E độc lập (Black-box Runner):**
  ```bash
  node tests/e2e-checkout.flow.mjs
  # Kiểm thử trực tiếp máy chủ Staging / Production:
  node tests/e2e-checkout.flow.mjs https://api-brewlite.onrender.com
  ```

---

## 6. Quy trình Làm việc & Quy ước Nhóm (Agile Scrum)

### 6.1. Quy ước Đặt tên Commit (Conventional Commits)
- `[Feat]`: Thêm một tính năng mới.
- `[Fix]`: Sửa lỗi phần mềm.
- `[Docs]`: Cập nhật tài liệu kỹ thuật, sơ đồ, markdown.
- `[Style]`: Chỉnh sửa khoảng trắng, format code (không ảnh hưởng logic).
- `[Refactor]`: Tái cấu trúc code (không đổi tính năng, không fix bug).
- `[Test]`: Bổ sung hoặc sửa đổi kịch bản kiểm thử (unit, integration, e2e).
- `[Chore]`: Thay đổi cấu hình build, dependencies, workflow CI/CD.

### 6.2. Chiến lược Nhánh (Branching Strategy)
- Nhánh `main`: Nhánh ổn định, sẵn sàng triển khai; được bảo vệ (Branch Protection), không commit trực tiếp.
- Nhánh thành viên: `TV1` (Trưởng nhóm), `TV2`, `TV3`, `TV4`, `TV5`, `TV6`, `TV7`.
- Mọi đóng góp đều phải tạo **Pull Request (PR)** từ nhánh thành viên vào `main`, được kiểm tra xung đột và review trước khi merge.

### 6.3. Định nghĩa Hoàn thành (Definition of Done - DoD)
Một User Story / Task được coi là hoàn thành khi:
1. Mã nguồn tuân thủ coding conventions, không có cảnh báo linter.
2. Vượt qua 100% các bài Unit Test và Integration Test liên quan.
3. Tài liệu thiết kế (SRS, Sơ đồ, Ma trận truy vết) được cập nhật đồng bộ.
4. Được review và phê duyệt bởi ít nhất Trưởng nhóm qua Pull Request.

---

## 7. Mục lục Hồ sơ Tài liệu Đồ án (Docs Navigation)

| STT | Tài liệu / Sơ đồ | Đường dẫn tệp | Nhiệm vụ tương ứng |
| :---: | :--- | :--- | :--- |
| 1 | Bối cảnh, Stakeholder & Phạm vi | [`docs/requirements/context-and-scope.md`](docs/requirements/context-and-scope.md) | Task 1.1 |
| 2 | Đặc tả yêu cầu phần mềm (SRS) | [`docs/requirements/SRS.md`](docs/requirements/SRS.md) | Task 1.2 |
| 3 | Đặc tả Use-case trọng tâm Checkout | [`docs/diagrams/use-case-checkout.md`](docs/diagrams/use-case-checkout.md) | Task 1.3 |
| 4 | Sơ đồ Use-case tổng quát | [`docs/diagrams/usecase-overview.svg`](docs/diagrams/usecase-overview.svg) | Task 1.2 |
| 5 | Sơ đồ Hoạt động (Activity Diagram) | [`docs/diagrams/activity-checkout.svg`](docs/diagrams/activity-checkout.svg) | Task 2.1 |
| 6 | Sơ đồ Tuần tự (Sequence Diagram) | [`docs/diagrams/sequence-checkout.svg`](docs/diagrams/sequence-checkout.svg) | Task 2.2 |
| 7 | Sơ đồ Lớp miền & Từ điển dữ liệu | [`docs/diagrams/class-domain.svg`](docs/diagrams/class-domain.svg) · [Data Dict](docs/diagrams/class-domain.md) | Task 2.3 |
| 8 | Tổng quan Kiến trúc & ADRs | [`docs/architecture/README.md`](docs/architecture/README.md) · [ADR Folder](docs/architecture/adr/) | Task 3.1 |
| 9 | Sơ đồ Triển khai & Hướng dẫn Vận hành | [`docs/diagrams/deployment.svg`](docs/diagrams/deployment.svg) · [Hướng dẫn](docs/deployment.md) | Task 3.2 |
| 10 | Ma trận Truy vết bắt buộc (RTM) | [`docs/traceability-matrix.md`](docs/traceability-matrix.md) | Task 8.1 |
| 11 | Quy trình Rollback sự cố | [Mục 9. Hướng dẫn Rollback](#9-hướng-dẫn-rollback-khi-gặp-sự-cố-rollback-procedures) | Task 5.4 · Mục 9.1 |
| 12 | Hướng dẫn cấu hình & kiểm thử VNPay Sandbox | [`docs/Huong-dan-cau-hinh-VNPAY.md`](docs/Huong-dan-cau-hinh-VNPAY.md) | Kỹ thuật thanh toán |
| 13 | Đối chiếu & kiểm tra migration VNPay | [`docs/Kiem-tra-migration-VNPAY.md`](docs/Kiem-tra-migration-VNPAY.md) | Quản trị cơ sở dữ liệu |
| 14 | Nhật ký phát hành phiên bản (Release Notes) | [`docs/release-notes.md`](docs/release-notes.md) | Task 5.4 · Mục 9.1 |
| 15 | Minh chứng thực nghiệm CI Pipeline | [`docs/ci-evidence.md`](docs/ci-evidence.md) | Task 4.4 |
| 16 | Báo cáo Sprint Review & Retrospective | [`docs/sprint-review-retrospective.md`](docs/sprint-review-retrospective.md) | Task 4.3 · Task 5.4 |

---

## 8. Checklist Nghiệm thu Đồ án (Assignment 2)

- [x] **Tài liệu Yêu cầu:** SRS rút gọn, Context & Scope (kèm ràng buộc), Đặc tả use-case trọng tâm.
- [x] **Sơ đồ Thiết kế UML:** Đầy đủ Activity, Sequence (5 lifelines), Class (Domain) và Deployment (CI & Registry).
- [x] **Kiến trúc & ADR:** Báo cáo kiến trúc Modular Monolith, 03 bản ADR chính thức (đầy đủ đối soát VNPay).
- [x] **Truy vết Yêu cầu:** Ma trận truy vết RTM phủ 100% 16 FRs và 20 NFRs với mã test cụ thể.
- [x] **Cấu trúc Monorepo:** Tách biệt `apps/web/`, `apps/api/`, `docs/`, `tests/`.
- [x] **Chuẩn Mobile-first & PWA:** Thiết kế giao diện di động, cấu hình `apps/web/app/manifest.ts`.
- [x] **Mã nguồn MVP Sprint 1 & Sprint 2:** Triển khai API Menu, Đặt hàng, Thanh toán và giao diện Web (Task 4.3 & 5.1).
- [x] **Kiểm thử Hệ thống:** 326 bài Unit/Integration test API + 28 tests Web pass 100% và kịch bản E2E luồng người dùng (Task 5.2).
- [x] **Tự động hóa CI/CD:** GitHub Actions CI (Quality Gate) & CD 4 giai đoạn chuẩn (Task 4.4 & Task 5.3).
- [x] **Minh chứng Thực nghiệm CI:** Nhật ký kiểm soát chất lượng chặn PR lỗi và cho phép merge khi pass (Task 4.4).
- [x] **Release Notes & Rollback:** Nhật ký phát hành `v1.0.0` & `v2.0.0`, tài liệu hướng dẫn vận hành và rollback 4 kịch bản (Task 5.4).
- [x] **Sprint Review & Retrospective:** Biên bản họp nghiệm thu và đánh giá cải tiến cho cả Sprint 1 & Sprint 2.
- [ ] **Triển khai Production:** Triển khai thực tế trên Cloud PaaS (Task 5.4).

---

## 9. Hướng dẫn Rollback khi Gặp Sự Cố (Rollback Procedures)

Theo quy định tại **Task 5.4 và Mục 9.1** của Assignment 2, hệ thống BrewLite thiết lập quy trình rollback chuẩn mực gồm các kịch bản đối phó khi bản triển khai Production gặp sự cố kỹ thuật:

### 9.1. Tiêu chí Kích hoạt Rollback (Triggers)
Kích hoạt quy trình rollback khẩn cấp khi phát hiện một trong các dấu hiệu sau:
- Endpoint kiểm tra sức khỏe `GET /health` trả về mã lỗi HTTP 5xx hoặc không phản hồi quá 10 giây.
- Tỷ lệ lỗi 5xx trên toàn hệ thống vượt quá 5% lưu lượng trong 5 phút đầu sau khi deploy.
- Luồng nghiệp vụ cốt lõi bị gián đoạn: Khách hàng không thể duyệt menu, giỏ hàng không tính được tiền, hoặc không tạo được đơn hàng / thanh toán.

### 9.2. Kịch bản 1: Rollback Tức Thời trên Nền Tảng Cloud PaaS (Zero Downtime)
- **Frontend Web (Vercel):**
  1. Truy cập **Vercel Dashboard** $\rightarrow$ chọn Project `brewlite-web` $\rightarrow$ thẻ **Deployments**.
  2. Xác định bản deploy ổn định liền kề trước đó (Healthy status).
  3. Nhấn vào biểu tượng `...` (Options) $\rightarrow$ Chọn **Instant Rollback**. Vercel sẽ tự động điều hướng lưu lượng DNS về phiên bản ổn định ngay lập tức trong vài giây.
- **Backend API (Render / Railway):**
  1. Truy cập **Render Dashboard** $\rightarrow$ chọn Service `brewlite-api` $\rightarrow$ thẻ **Events / History**.
  2. Chọn bản deploy ổn định trước đó $\rightarrow$ Chọn **Rollback to this deploy**.
  3. Hoặc vào mục **Settings** $\rightarrow$ cập nhật lại tham số `Commit SHA` hoặc Docker Tag trỏ về image ổn định gần nhất.

### 9.3. Kịch bản 2: Rollback Docker Container (Môi trường Local / VPS)
Nếu chạy ứng dụng qua Docker Compose hoặc VPS:
```bash
# 1. Dừng cụm container đang bị lỗi
docker compose down

# 2. Khôi phục tag image của bản build ổn định liền trước trong docker-compose.yml
# (thay thế tag :latest bằng commit SHA ổn định trước đó)
docker compose pull
docker compose up -d --remove-orphans

# 3. Xác thực kiểm tra sức khỏe container
docker compose ps
curl -f http://localhost:8080/health
```

### 9.4. Kịch bản 3: Hoàn tác Mã nguồn bằng Git & Kích hoạt lại CD Pipeline
Tuyệt đối không sử dụng `git push --force` trên nhánh được bảo vệ (`main`). Sử dụng lệnh `git revert` tạo commit hoàn tác an toàn:
```bash
# 1. Chuyển về nhánh chính và đồng bộ mới nhất
git checkout main
git pull origin main

# 2. Tạo commit hoàn tác commit gây lỗi (thay <COMMIT_SHA_LỖI> bằng hash commit lỗi)
git revert <COMMIT_SHA_LỖI> --no-edit -m "[Fix]: hoàn tác commit lỗi và kích hoạt quy trình rollback tự động"

# 3. Đẩy commit lên GitHub để kích hoạt CD Pipeline tự động đóng gói và triển khai lại
git push origin main
```

### 9.5. Kịch bản 4: Xử lý Cơ sở Dữ liệu & Prisma Migration (Database Safety)
Tuân thủ nguyên tắc thiết kế mở rộng không phá vỡ tính tương thích ngược (*Expand/Contract Pattern* theo ADR-002):
- Nếu bản migration mới bị lỗi trong lúc chạy `prisma migrate deploy`: Prisma tự động rollback giao dịch (atomic transaction).
- Nếu cần can thiệp đánh dấu trạng thái migration trong trường hợp khẩn cấp:
  ```bash
  cd apps/api
  # Đánh dấu trạng thái migration lỗi đã được giải quyết
  npx prisma migrate resolve --rolled-back "<tên_migration_lỗi>"
  ```
- Nếu dữ liệu bị sai lệch, thực hiện khôi phục từ bản snapshot sao lưu định kỳ:
  ```bash
  # Khôi phục database từ tệp sao lưu trước khi deploy
  docker exec -i brewlite-postgres psql -U postgres -d brewlite < backups/backup_pre_deploy.sql
  ```

### 9.6. Xác nhận Sau Rollback (Post-Rollback Verification)
Sau khi hoàn tất rollback, bắt buộc chạy kiểm thử khói để xác nhận hệ thống đã hồi phục:
```bash
# Chạy runner kiểm thử toàn diện luồng end-to-end
node tests/e2e-checkout.flow.mjs https://api-brewlite.onrender.com
```

## Hoàn tiền

Xem [hướng dẫn hoàn bằng điểm](docs/guides/REFUNDS.md) cho tỷ lệ quy đổi, quyền duyệt, kiểm thử và cách xử lý lịch sử hoàn tiền cũ.
