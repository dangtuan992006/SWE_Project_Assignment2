# Hướng dẫn triển khai hệ thống BrewLite (Task 3.2)

- **Dự án:** BrewLite — Ứng dụng đặt cà phê không dùng tiền mặt
- **Môn học:** Công nghệ Phần mềm, Trường Đại học Sài Gòn
- **Tài liệu thiết kế / sơ đồ:** [`docs/diagrams/deployment.puml`](diagrams/deployment.puml) · [`docs/diagrams/deployment.svg`](diagrams/deployment.svg)

---

## Sơ đồ triển khai môi trường Production

![Sơ đồ triển khai Production](diagrams/deployment.svg)

> **Kiến trúc triển khai thực tế:**
> - **Frontend Web:** [Vercel](https://swe-project-assignment2.vercel.app) (`apps/web`, Next.js 16, Node 24)
> - **Backend API:** [Render Cloud PaaS](https://brewlite-api-2tuk.onrender.com) (`apps/api`, NestJS Container `:8080`, Node 24)
> - **Cơ sở dữ liệu:** Render Managed PostgreSQL 16 (Prisma ORM & `prisma migrate deploy`)
> - **Container Registry:** GitHub Container Registry (`ghcr.io/<repo>/brewlite-api` & `brewlite-web`)
> - **Cổng thanh toán:** VNPay Sandbox (HMAC-SHA512, Return URL & IPN; `PAYMENT_PROVIDER=VNPAY` bắt buộc trên Production) và Mock Payment Adapter cho môi trường phát triển cục bộ (`PAYMENT_PROVIDER=MOCK`)

---

## 1. Cấu trúc liên kết Runtime (Runtime Topology)

```text
Trình duyệt / PWA (Khách hàng & Staff Barista)
    │
    │ HTTPS :443
    ▼
Vercel Web CDN (https://swe-project-assignment2.vercel.app)
    │
    │ HTTPS REST + CORS + JWT (Authorization: Bearer)
    ▼
Render API Service (https://brewlite-api-2tuk.onrender.com -> Container :8080)
    │                                \
    │ TLS / Mạng nội bộ :5432         \ HTTPS (HMAC-SHA512 + Return/IPN)
    ▼                                  ▼
Render Managed PostgreSQL 16      VNPay Sandbox / Mock Payment Adapter
```

- **Dịch vụ Web (Vercel - Next.js):** Phục vụ toàn bộ 9 App Router routes (`/`, `/products/[id]`, `/cart`, `/orders`, `/orders/[id]`, `/login`, `/register`, `/staff`, `/UserProfile`) cùng static assets và `manifest.ts`. Dịch vụ Web tuyệt đối không chứa `DATABASE_URL` hay khóa bí mật thanh toán.
- **Dịch vụ API (Render - NestJS):** Lắng nghe theo `PORT` (mặc định `8080`), cung cấp REST API, tài liệu Swagger (`/swagger`), endpoint liveness `GET /health` và tác vụ nền `OrderExpirationService` (quét hết hạn đơn `PENDING` sau 10 phút).
- **Cơ sở dữ liệu (Render Managed PostgreSQL 16):** Lưu trữ bền vững toàn bộ 12 bảng Prisma (`categories`, `products`, `users`, `orders`, `order_items`, `payments`, `vouchers`, `loyalty_transactions`, `ingredients`, `recipe_items`, `refund_requests`, `ingredient_audit_logs`), kết nối qua TLS/Private Network.
- **Cổng thanh toán (`PAYMENT_PROVIDER`):** Trên môi trường `NODE_ENV=production`, `PaymentConfiguration` bắt buộc `PAYMENT_PROVIDER=VNPAY` và ký giao dịch bằng HMAC-SHA512; cục bộ mặc định `MOCK` để phát triển và kiểm thử không cần merchant sandbox.

---

## 2. Phân tách ranh giới các môi trường

| Môi trường | Mục đích sử dụng | Dữ liệu và Quản lý biến môi trường bí mật |
| :--- | :--- | :--- |
| **Local (Dev / Docker Compose)** | Chạy cục bộ qua `docker-compose.yml` (`db:5432` volume `pgdata`, `backend:8080`, `frontend:3000`) hoặc `npm run start:dev` / `npm run dev` | Sử dụng `.env` từ `apps/api/.env.example` và `apps/web/.env.example` (không commit lên Git); mặc định `PAYMENT_PROVIDER=MOCK` |
| **CI/CD (GitHub Actions - Node 24)** | Kiểm tra lint (`oxlint` & `eslint`), chạy test API (`npm test`) & Web (`npm run test:vnpay`), build, push image lên GHCR (`ghcr.io`) và chạy smoke test (`--smoke`) | Dùng dịch vụ Postgres container riêng trên runner và GitHub Secrets (`PROD_API_URL`, `PROD_WEB_URL`, `BACKEND_DEPLOY_WEBHOOK`, `FRONTEND_DEPLOY_WEBHOOK`, `GITHUB_TOKEN`) |
| **Production (Vercel + Render)** | Phục vụ lưu lượng thực tế cho Khách hàng và Staff Portal | Secret quản lý trong Vercel/Render Secret Store, bắt buộc HTTPS, `PAYMENT_PROVIDER=VNPAY`, DB lưu trữ bền vững |

Tệp `apps/api/.env.example` là nguồn tham chiếu chuẩn cho Backend:

```dotenv
PORT=8080
DATABASE_URL=postgresql://admin:admin111@localhost:5432/brewlite_db?schema=public
JWT_SECRET=super_secret_jwt_key_example_brewlite_2026
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
PAYMENT_PROVIDER=MOCK
VNPAY_TMN_CODE=ma_tmn_code_duoc_cap
VNPAY_HASH_SECRET=hash_secret_duoc_cap
VNPAY_HOST=https://sandbox.vnpayment.vn
VNPAY_TEST_MODE=true
VNPAY_RETURN_URL=https://BACKEND-TUNNEL.trycloudflare.com/payments/vnpay/return
VNPAY_IPN_URL=https://BACKEND-TUNNEL.trycloudflare.com/payments/vnpay/ipn
```

Frontend (`apps/web/.env.example`) chỉ nhận biến công khai không nhạy cảm:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_VNPAY_ALLOWED_ORIGINS=https://sandbox.vnpayment.vn
```

> Trên Production, `NEXT_PUBLIC_API_URL` trỏ đến `https://brewlite-api-2tuk.onrender.com`, còn `CORS_ORIGIN` / `FRONTEND_URL` ở Backend cấu hình cho `https://swe-project-assignment2.vercel.app`.

---

## 3. Cấu hình triển khai & Container Registry

### 3.1. Dịch vụ Web (Vercel — `apps/web`)
1. Root Directory: `apps/web` (Node.js 24, `apps/web/Dockerfile` dùng `node:24-alpine`).
2. Cài đặt & Build: `npm ci` → `npm run build` (tạo thư mục build `.next` phục vụ chạy `npm start`).
3. Khởi chạy: `npm run start`.
4. Biến môi trường: `NEXT_PUBLIC_API_URL=https://brewlite-api-2tuk.onrender.com`, `NEXT_PUBLIC_VNPAY_ALLOWED_ORIGINS=https://sandbox.vnpayment.vn`.

### 3.2. Dịch vụ API (Render — `apps/api`)
1. Root Directory: `apps/api` (Node.js 24, `apps/api/Dockerfile` dùng `node:24-alpine`).
2. Cài đặt, Migration & Build: `npm ci` → `npx prisma generate` → `npx prisma migrate deploy` → `npm run build`.
3. Khởi chạy: `npm run start:prod` (cổng `PORT=8080`).
4. Biến môi trường: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `CORS_ORIGIN`, `PAYMENT_PROVIDER=VNPAY`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_HOST`, `VNPAY_RETURN_URL`, `VNPAY_IPN_URL`.
5. Health Check Path: `GET /health` (Swagger Docs tại `/swagger`).

### 3.3. Cơ sở dữ liệu (Render Managed PostgreSQL 16)
- Dữ liệu bền vững và backup tự động trên Render Managed PostgreSQL; chạy cục bộ qua volume `pgdata` trong `docker-compose.yml`.
- Không mở cổng DB ra mạng công cộng; áp dụng migration trước khi khởi động phiên bản API mới.

### 3.4. GitHub Container Registry (`ghcr.io`) & CI/CD Workflows
- **`.github/workflows/ci.yml`:** Chạy trên Node 24 cho mọi push/PR tới `main`, `TV1..TV7`, `feature/*`; kiểm tra `npm run lint` (API `oxlint` & Web `eslint`), `npm test` (API), `npm run test:vnpay` (Web), `npm run build`.
- **`.github/workflows/cd.yml`:** Kích hoạt khi push lên `main` hoặc push tag `v*.*.*` qua 4 giai đoạn:
  1. `quality-gate`: chạy lại lint + unit tests (API & Web) trên Node 24 + Postgres 16 service.
  2. `build`: kiểm tra `npx prisma generate`, `npm run build` cho Backend & Frontend.
  3. `package-and-deploy`: đăng nhập `ghcr.io`, chạy `docker buildx build --push` cho **cả hai** image `ghcr.io/<repo>/brewlite-api` và `ghcr.io/<repo>/brewlite-web` (tags: `<commit_sha>`, `latest`, và `<tag_name>` nếu là release tag), sau đó gọi deploy webhook (`BACKEND_DEPLOY_WEBHOOK`, `FRONTEND_DEPLOY_WEBHOOK`).
  4. `smoke-test`: vòng lặp kiểm tra HTTP 200 (tối đa 12 lần × 5 giây = 60 giây chờ Render cold-start) tới `${TARGET_URL}/health`, `${TARGET_URL}/swagger`, `${WEB_URL}` và chạy `node tests/e2e-checkout.flow.mjs --smoke "$TARGET_URL"`.

---

## 4. Mạng và Bảo mật (Networking & Security)

- Toàn bộ lưu lượng Production sử dụng **HTTPS** (`swe-project-assignment2.vercel.app` & `brewlite-api-2tuk.onrender.com`).
- CORS kiểm soát chặt chẽ theo `CORS_ORIGIN` / `FRONTEND_URL`.
- `ValidationPipe` (`whitelist: true, transform: true, forbidNonWhitelisted: true`) và `AllExceptionsFilter` chặn dữ liệu thừa và ẩn stack trace.
- Giao dịch VNPay xác thực chữ ký HMAC-SHA512; không tin cậy số tiền từ client.

---

## 5. Vận hành, Giám sát và Quy trình Phát hành / Rollback

1. **Giám sát & Health Check:** Render theo dõi `GET /health` và tự khởi động lại container nếu lỗi.
2. **Kiểm tra sau phát hành:** Thực thi tự động trong `cd.yml` job `smoke-test` (`node tests/e2e-checkout.flow.mjs --smoke https://brewlite-api-2tuk.onrender.com`).
3. **Rollback:** Hỗ trợ 4 kịch bản chi tiết trong `README.md` Mục 9 (Instant Rollback trên Vercel/Render, khôi phục Docker image tag trên GHCR, `git revert` trên `main`, và `prisma migrate resolve` / DB restore).
