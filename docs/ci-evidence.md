# Minh chứng Thực nghiệm Pipeline CI/CD (Task 4.4 & Task 5.3 Evidence)
## Dự án BrewLite — Tự động hóa Tích hợp & Phân phối Liên tục

Tài liệu này ghi nhận bằng chứng thực tế từ **GitHub Actions**, **GitHub Pull Requests** và kiểm chứng cục bộ cho hai pipeline tự động trong repository [`dangtuan992006/SWE_Project_Assignment2`](https://github.com/dangtuan992006/SWE_Project_Assignment2):

- **CI Pipeline:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — Đáp ứng **Task 4.4**:
  $$\text{Install} \longrightarrow \text{Lint} \longrightarrow \text{Unit Test} \longrightarrow \text{Build}$$
- **CD Pipeline:** [`.github/workflows/cd.yml`](../.github/workflows/cd.yml) — Đáp ứng **Task 5.3**:
  $$\text{Quality Gate (Lint \& Test)} \longrightarrow \text{Build Artifacts} \longrightarrow \text{Docker Build \& GHCR Push + Deploy} \longrightarrow \text{Strict Smoke Test}$$

> **Quy tắc bắt buộc:** Mọi Pull Request từ các nhánh thành viên (`TV1` $\rightarrow$ `TV7`) vào nhánh `main` tuyệt đối không được phép merge nếu bất kỳ bước kiểm tra linter, unit test hoặc build nào thất bại.

---

## 1. Danh mục Pull Request & GitHub Actions Runs Thực tế

| Hạng mục / PR / Run | Sự kiện / Nhánh | Commit SHA | Kết quả | Liên kết GitHub thực tế |
| :--- | :--- | :---: | :---: | :--- |
| **Pull Request #1 (`TV1 -> main`)** | `pull_request` (17 commits, 127 files) | `e5cef5b` (merge) | ✅ Merged | [`pull/1`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/1) |
| **CI Pipeline #9 (cho PR #1)** | `pull_request` (`TV1`) | `0a2f572` | ✅ PASS (BE 55s · FE 82s) | [`actions/runs/42967695969`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42967695969) |
| **CD Pipeline #4 (Failure — Node ESM)** | `push` (`main`) | `e5cef5b` | ❌ FAIL (Quality Gate 55s) | [`actions/runs/42967883207`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42967883207) |
| **CD Pipeline #5 (Failure — GHCR Tag)** | `push` (`main`) | `a729731` | ❌ FAIL (Docker Build 10s) | [`actions/runs/42968708235`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42968708235) |
| **CD Pipeline #6 (Passed sau sửa lỗi)** | `push` (`main`) | `feb6039` | ✅ PASS (4/4 stages) | [`actions/runs/42969347819`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42969347819) |
| **Pull Request #2 (`TV1 -> main`)** | `pull_request` (5 commits, 9 files) | `ec999e2` (merge) | ✅ Merged | [`pull/2`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/2) |
| **CI Pipeline #14 (cho PR #2)** | `pull_request` (`TV1`) | `d7b5ec0` | ✅ PASS (BE 56s · FE 84s) | [`actions/runs/43062394947`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43062394947) |
| **CI Pipeline #15 (`main` mới nhất)** | `push` (`main`) | `ec999e2` | ✅ PASS (BE 63s · FE 79s) | [`actions/runs/43062824019`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43062824019) |
| **CD Pipeline #7 (`main` mới nhất)** | `push` (`main`) | `ec999e2` | ✅ PASS (4/4 stages) | [`actions/runs/43062823702`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43062823702) |
| **CI Pipeline #16 (`TV1` Stage 2)** | `push` (`TV1`) | `ea1b2fc` | ✅ PASS (2/2 jobs: BE 52s, FE 67s) | [`actions/runs/43388555504`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43388555504) |
| **Pull Request #3 (`TV1 -> main`)** | `pull_request` (Đợt hoàn thiện & đối soát cuối) | *Stage 3 local commits* | ⏳ Chờ user duyệt push Stage 3 & mở PR #3 | `[Chờ push Stage 3 lên TV1 & mở PR #3 -> main]` |

> **Ghi chú các lần CD thất bại lịch sử trước khi hoàn thiện cấu hình secret & pipeline:**  
> - [`actions/runs/41846006542`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/41846006542) (`c0fca08`) và [`actions/runs/41943044004`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/41943044004) (`b113e04`) thất bại tại bước `Trigger Backend API Deployment` do chưa có secret webhook; đã khắc phục ở commit `6a0e563` và chuẩn hóa đủ 4 giai đoạn ở `8dc678b`.

---

## 2. Kịch bản 1: Pipeline Phát hiện Lỗi và Tự động Chặn Triển khai / Merge (Failed Gate Evidence)

### 2.1. Bằng chứng thực tế trên GitHub Actions — Lỗi tương thích ESM & Jest tại Quality Gate (`#4`)
Sau khi merge [`pull/1`](https://github.com/dangtuan992006/SWE_Project_Assignment2/pull/1) tại commit `e5cef5b` (`2026-11-11T05:45:59Z`), pipeline CD tự động chạy trên nhánh `main` và **chặn hoàn toàn các bước Build, Docker & Deploy** khi bước Backend Unit Tests thất bại:

- **Run URL:** [`https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42967883207`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42967883207)
- **Job thất bại:** `1. Quality Gate (Lint & Test)` — [`job/130349228397`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42967883207/job/130349228397) (FAILED in `55s`)
- **Bước lỗi:** `Chạy toàn bộ Unit & Integration Tests (Backend)` (môi trường Node 20 trên runner không hỗ trợ nạp ESM theo cấu hình Jest của NestJS 12).
- **Tác động chặn tự động:**
  - `1. Quality Gate (Lint & Test)`: ❌ `failure` (`55s`)
  - `2. Build Artifacts`: ⏭️ `skipped`
  - `3. Docker Image & Cloud Deployment`: ⏭️ `skipped`
  - `4. Post-Deployment Smoke Test`: ⏭️ `skipped`
- **Khắc phục:** Commit `a729731` (`[Fix]: nang cap Node.js len phien ban 24 trong CD pipeline de tuong thich ESM va Jest`) nâng Node.js lên phiên bản 24; ngay sau đó run [`42968708235`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42968708235) tiếp tục bắt được lỗi tên tag Docker chứa ký tự hoa ở [`job/130352816890`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42968708235/job/130352816890) (`10s`) và chặn bước Smoke Test cho tới khi `feb6039` chuẩn hóa chữ thường (`tr '[:upper:]' '[:lower:]'`), giúp run [`42969347819`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/42969347819) vượt qua toàn bộ 4/4 giai đoạn.

### 2.2. Bằng chứng thực tế tại Cổng Kiểm tra Build Frontend trên nhánh `TV1` (Commit `fd6d857`)
Trong quá trình xử lý cảnh báo lint ở commit `fd6d857`, lệnh `import Image from "next/image";` (`apps/web/app/staff/page.tsx:21`) đã che khuất (shadow) hàm khởi tạo DOM toàn cục `new Image()` ở dòng `573` (`handleProductImageFileChange`). Khi chạy cổng kiểm tra `npm run build`, trình biên dịch TypeScript phát hiện lỗi ngay lập tức (`TS2554` / `TS7009`) và chặn build đóng gói cho tới khi đổi alias thành `import NextImage from "next/image";` và `<NextImage ... />` (`apps/web/app/staff/page.tsx:21,2123`).

---

## 3. Kịch bản 2: Kiểm chứng Chất lượng Thành công Tuyệt đối (Passed Gate Evidence)

### 3.1. Kết quả kiểm tra thực tế trên GitHub Actions (`PR #2` & `main`)
- **PR #2 CI Pipeline (`#14`):** [`https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43062394947`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43062394947)
  - ✅ `Backend (Lint, Unit Test & Build)` — `success` in `56s` ([`job/130668158235`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43062394947/job/130668158235))
  - ✅ `Frontend (Lint & Build)` — `success` in `84s` ([`job/130668158795`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43062394947/job/130668158795))
- **CD Pipeline trên `main` (`#7`):** [`https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43062823702`](https://github.com/dangtuan992006/SWE_Project_Assignment2/actions/runs/43062823702)
  - ✅ `1. Quality Gate (Lint & Test)` — `success` in `120s`
  - ✅ `2. Build Artifacts` — `success` in `98s`
  - ✅ `3. Docker Image & Cloud Deployment` — `success` in `114s`
  - ✅ `4. Post-Deployment Smoke Test` — `success` in `25s`

### 3.2. Nhật ký thực thi xác minh cục bộ cho đợt sửa lỗi chuẩn bị PR #3 (`TV1`)

#### Backend (`apps/api` — Node.js 24)
```text
> backend@0.0.1 lint
> oxlint --type-aware src/ test/

Found 0 warnings and 0 errors.
97 files checked with 111 rules.
```

```text
> backend@0.0.1 test
> node --experimental-vm-modules ./node_modules/jest/bin/jest.js

Test Suites: 26 passed, 26 total
Tests:       340 passed, 340 total
Snapshots:   0 total
Ran all test suites.
```

```text
> backend@0.0.1 build
> nest build
(Exit Code 0)
```

- **Kiểm thử E2E nội bộ NestJS (chạy ở Stage 2 `ea1b2fc` trên DB `brewlite_test`):** 1 suite, **4/4 tests PASS** (`Exit Code 0`; chưa chạy lại ở Stage 3 do Docker Desktop đang tắt).

#### Frontend (`apps/web` — Next.js 16.4.6 Turbopack, ESLint v9.39.5)
```text
> frontend@0.1.0 lint
> eslint
(Exit Code 0 — 0 warnings, 0 errors)
```

```text
> frontend@0.1.0 test
> node --test tests/*.test.mjs

ℹ tests 31
ℹ suites 0
ℹ pass 31
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
*(Gồm `tests/security-utils.test.mjs` 3/3 pass và `tests/vnpay-payment.test.mjs` 28/28 pass; `npm run test:vnpay` riêng lẻ đạt 28/28 pass).*

```text
> frontend@0.1.0 build
> next build

▲ Next.js 16.4.6 (Turbopack)
✓ Compiled & generated static pages (13/13 static pages)

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /cart
├ ○ /login
├ ○ /manifest.webmanifest
├ ○ /orders
├   /orders/[id]
│ └ ◐ /orders/[id]
├   /products/[id]
│ └ ◐ /products/[id]
├ ○ /register
├ ○ /staff
└ ○ /UserProfile
```

#### Root Black-box E2E & Integration (`tests/`)
- `node tests/e2e-checkout.flow.mjs` (local `:8080`, cả 2 chế độ `PAYMENT_PROVIDER=MOCK` và `VNPAY` — chạy tại Stage 2 `ea1b2fc`): **9/9 bước PASS** (xác thực `Idempotent-Replayed: true` ở `MOCK` và URL `https://sandbox.vnpayment.vn` ở `VNPAY`; chưa chạy lại ở Stage 3 do Docker Postgres cục bộ đang tắt).
- `node --test tests/e2e-integration.spec.ts` (Node 24 native runner trên `:8080` — chạy tại Stage 2 `ea1b2fc`): **2 suites / 6 tests PASS** (`Exit Code 0`; chưa chạy lại ở Stage 3 do Docker Postgres cục bộ đang tắt).
- `node tests/e2e-checkout.flow.mjs --smoke https://brewlite-api-2tuk.onrender.com` (chạy lại ở Stage 3): **4/4 kiểm tra chỉ đọc PASS** (`GET /health`, `GET /products`, `GET /products/:id`, `GET /payments/config`).
- **Browser UI E2E (Stage 3):** Đã xác minh trên `http://localhost:3102` (bản build `TV1`) và `https://swe-project-assignment2.vercel.app` (sản phẩm, bộ lọc, giỏ hàng, `/login`, `/register`, `/UserProfile`, `StaffRoleGuard` trên `/staff`, layout mobile `390x844`).

---

## 4. Bảng Tổng Hợp Kiểm Soát Cổng Chất Lượng (Quality Gate Summary)

| Tầng kiểm tra | Công cụ thực thi | Lệnh kiểm tra | Điều kiện vượt qua (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **Static Lint Backend (Stage 3)** | Oxlint (`oxlint --type-aware`) | `npm run lint` (`apps/api`) | 0 warnings, 0 errors trên 97 files / 111 rules | ✅ PASSED |
| **Static Lint Frontend** | ESLint (`eslint-config-next`) | `npm run lint` (`apps/web`) | 0 warnings, 0 errors | ✅ PASSED |
| **Khởi tạo ORM** | Prisma CLI (`v6.19.3`) | `npx prisma generate` | Sinh mã Client khớp 100% `schema.prisma` (12 models, 9 enums) | ✅ PASSED |
| **Unit & Integration BE (Stage 3)** | Jest (`--experimental-vm-modules`) | `npm test` (`apps/api`) | 26 suites / 340 tests đạt 100% | ✅ PASSED |
| **Unit Test Thanh toán FE** | Node.js 24 Test Runner | `npm run test:vnpay` (`apps/web`) | 28 / 28 tests pass (`vnpay-payment.test.mjs`) | ✅ PASSED |
| **Full Unit & Security FE (Stage 3)** | Node.js Test Runner | `npm test` (`apps/web`) | 31 / 31 tests pass (`security-utils.test.mjs` + `vnpay-payment.test.mjs`) | ✅ PASSED |
| **E2E & HTTP Integration** | NestJS Supertest, Node 24 & Browser UI | `npm run test:e2e`, `e2e-checkout.flow.mjs`, `e2e-integration.spec.ts` | Stage 2 `ea1b2fc` (4 BE E2E + 9 bước flow + 6 HTTP tests); Stage 3 (`--smoke` 4/4 + Browser UI E2E) | ✅ PASSED (scope ghi chú) |
| **Biên dịch Backend** | NestJS CLI | `npm run build` (`apps/api`) | Biên dịch TypeScript sang `dist/` sạch sẽ (`Exit Code 0`) | ✅ PASSED |
| **Biên dịch Frontend** | Next.js 16.4.6 Turbopack | `npm run build` (`apps/web`) | 13/13 static pages, 11 route entries App Router (`Exit Code 0`) | ✅ PASSED |
| **Cấu hình Docker & CI/CD** | Docker Compose & PyYAML | `docker compose config --quiet`, YAML parse | Hợp lệ cấu hình `ci.yml`, `cd.yml` (Node 24 + GHCR push + strict `--smoke`) | ✅ PASSED |
