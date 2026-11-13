# HƯỚNG DẪN ĐỌC HIỂU CODE VÀ TÍCH HỢP NỀN TẢNG
> **Dành cho:** Toàn bộ thành viên nhóm dự án BrewLite (TV2, TV3, TV4, TV5, TV6, TV7)  
> **Người biên soạn:** Đặng Ngọc Tuấn (Thành viên 1 - Trưởng nhóm / Phụ trách Core Foundation & Shared Layout)  
> **Dự án:** BrewLite — Ứng dụng đặt cà phê không dùng tiền mặt (Agile Scrum - Assignment 2)

> **Lưu ý cập nhật cấu trúc Monorepo (Assignment 2):**  
> Tài liệu gốc được biên soạn từ Sprint 1 (khi mã nguồn còn dùng cấu trúc `SWE_Project/backend/`, `frontend/`, `Docs/`). Từ giai đoạn chuẩn hóa và triển khai Assignment 2, toàn bộ thư mục gốc được tổ chức lại trong `SWE_Project_Assignment2/` với `apps/api/` (thay cho `backend/`), `apps/web/` (thay cho `frontend/`) và `docs/` (thay cho `Docs/`). Mọi đường dẫn bên dưới đã được cập nhật tương ứng theo cấu trúc thực tế hiện hành.

---

## 1. MỤC ĐÍCH CỦA TÀI LIỆU NÀY

Trong Sprint 1, Thành viên 1 (Trưởng nhóm) đã xây dựng **Core Foundation & Shared Layout** làm **phần móng kỹ thuật chung** cho toàn bộ hệ thống.

Mục tiêu cốt lõi của phần móng này là thực hiện nguyên tắc **"Zero-blocking"**:
1. Cung cấp sẵn toàn bộ kiểu dữ liệu (Types/Interfaces) chuẩn hóa theo Class Diagram để Frontend và Backend không bị lệch dữ liệu.
2. Dựng sẵn khung giao diện chuẩn di động (Mobile-first Layout) để các thành viên phát triển Frontend dễ dàng gắn các trang/component mà không phải tự tạo lại Header/Footer.
3. Cấu hình sẵn bộ lọc bảo mật, kiểm tra dữ liệu và tiện ích gọi API để tránh lặp mã nguồn.
4. Làm nền tảng tích hợp đầy đủ các module nghiệp vụ ở Sprint 2 (`Auth`, `Products`, `Orders`, `Payments` + VNPay Sandbox, `Promotions`, `Inventory` & Staff Portal `/staff`).

---

## 2. BẢN ĐỒ CÁC TỆP MÃ NGUỒN TRONG MONOREPO

Các tệp mã nguồn được tổ chức trong Monorepo `SWE_Project_Assignment2/` như sau:

```text
SWE_Project_Assignment2/
├── .gitignore                          --> Bảo vệ repository, chặn lộ file rác, cache và file môi trường .env
├── .env.example                        --> Mẫu biến môi trường tổng thể cho toàn bộ dự án
├── docker-compose.yml                  --> Cấu hình chạy đồng thời 3 container: PostgreSQL 16, Backend NestJS (:8080), Frontend Next.js (:3000)
│
├── docs/                               --> Tài liệu SRS, Context & Scope, UML Diagrams (.puml/.svg), ADRs, RTM, Deployment
│
├── tests/                              --> Kiểm thử tích hợp End-to-End độc lập (e2e-checkout.flow.mjs, e2e-integration.spec.ts)
│
├── apps/api/                           --> (Trước đây là backend/) Backend Modular Monolith (NestJS + Prisma + PostgreSQL)
│   ├── .env.example                    --> Biến môi trường mẫu cho Backend (PORT=8080, DATABASE_URL, JWT_SECRET, PAYMENT_PROVIDER)
│   ├── Dockerfile                      --> Dockerfile đa tầng (Multi-stage build) chạy NestJS production (Node 24)
│   ├── prisma/
│   │   ├── schema.prisma               --> Lược đồ CSDL PostgreSQL (12 models, 9 enums)
│   │   └── seed.ts                     --> Dữ liệu mẫu: 2 danh mục, 10 đồ uống, 3 voucher, 10 nguyên liệu & tài khoản test
│   └── src/
│       ├── main.ts                     --> Điểm khởi động Backend: PORT 8080, CORS, ValidationPipe, AllExceptionsFilter, Swagger (/swagger)
│       ├── app.module.ts               --> Root module tích hợp Products, Health, Orders, Auth, Payments, Promotions, Inventory, Observe
│       ├── common/
│       │   ├── types/brewlite.ts       --> Hợp đồng kiểu dữ liệu tĩnh: Enum và Interface dùng chung phía Backend
│       │   ├── utils/pricing.util.ts   --> Hàm tiện ích tính đơn giá chuẩn (calculateItemPrice) phía Backend
│       │   ├── filters/http-exception.filter.ts --> Bộ lọc AllExceptionsFilter bắt mọi lỗi hệ thống, ẩn stack trace bảo mật
│       │   └── entities/base.entity.ts --> Lớp thực thể cơ sở BaseEntity (id, createdAt, updatedAt)
│       ├── health/                     --> Liveness check (GET /health) + Unit test
│       ├── auth/                       --> Đăng ký, đăng nhập JWT, profile, JwtAuthGuard & RolesGuard
│       ├── products/                   --> Menu sản phẩm & chi tiết đồ uống (GET /products, GET /products/:id)
│       ├── orders/                     --> Tạo đơn Idempotent, State Machine, Staff orders, Hủy đơn & Duyệt hoàn tiền, hết hạn 10 phút
│       ├── payments/                   --> Thanh toán MOCK & VNPay Sandbox (HMAC-SHA512, Return URL, IPN, đối soát)
│       ├── promotions/                 --> Áp dụng voucher, danh sách voucher & đổi điểm thưởng Loyalty
│       └── inventory/                  --> Quản lý kho nguyên liệu, công thức size S/M/L, Audit Log & recalculate-stock (BARISTA/ADMIN)
│
└── apps/web/                           --> (Trước đây là frontend/) Frontend Next.js (App Router, React 19, TailwindCSS v4)
    ├── .env.example                    --> Biến môi trường mẫu cho Frontend (NEXT_PUBLIC_API_URL=http://localhost:8080)
    ├── Dockerfile                      --> Dockerfile đa tầng chạy Next.js production với `npm start` (Node 24)
    ├── types/brewlite.ts               --> Hợp đồng kiểu dữ liệu tĩnh: Enum và Interface dùng chung phía Frontend
    ├── stores/
    │   └── cartStore.ts                --> Quản lý trạng thái giỏ hàng & đồng bộ sự kiện cập nhật (Zustand + persist)
    ├── hooks/
    │   └── usePaymentProvider.ts       --> Hook lấy cấu hình cổng thanh toán (MOCK / VNPAY) từ Backend
    ├── utils/
    │   ├── pricing.ts                  --> Hàm tiện ích tính đơn giá và tổng tiền món theo Size & Topping
    │   ├── apiClient.ts                --> Trình gọi API dùng chung (fetch bọc sẵn JWT token)
    │   ├── authStorage.ts              --> Lưu trữ token & thông tin người dùng phía client
    │   └── startPayment.ts / startVnpayPayment.ts / vnpayCheckout.ts --> Luồng điều phối thanh toán & đối soát VNPay
    ├── components/
    │   ├── Header.tsx                  --> Thanh đầu trang Mobile-first: Logo BrewLite + Giỏ hàng có Cart Badge tự cập nhật
    │   └── BottomNav.tsx               --> Thanh điều hướng dưới đáy màn hình
    ├── tests/
    │   └── vnpay-payment.test.mjs      --> Bộ unit test cho tiện ích điều phối & đối soát VNPay (28 tests)
    └── app/
        ├── layout.tsx                  --> Khung giao diện gốc (Header, BottomNav, ToastContainer)
        ├── page.tsx                    --> Màn hình chính (/): Thực đơn đồ uống & lọc danh mục
        ├── products/[id]/page.tsx      --> Chi tiết sản phẩm (/products/[id]): chọn Size S/M/L & Topping
        ├── cart/page.tsx               --> Giỏ hàng & Thanh toán (/cart): chọn Voucher, thanh toán VNPay / Mock
        ├── orders/page.tsx             --> Lịch sử đơn hàng (/orders)
        ├── orders/[id]/page.tsx        --> Chi tiết đơn hàng & đối soát thanh toán (/orders/[id])
        ├── login/page.tsx              --> Đăng nhập (/login)
        ├── register/page.tsx           --> Đăng ký (/register)
        ├── staff/page.tsx              --> Cổng nhân viên Barista/Admin (/staff): xử lý đơn, kho nguyên liệu & hoàn tiền
        └── UserProfile/page.tsx        --> Hồ sơ cá nhân & Điểm thưởng Loyalty (/UserProfile)
```

---

## 3. THỨ TỰ ĐỌC HIỂU CODE KHUYẾN NGHỊ

Để hiểu nhanh toàn bộ mã nguồn, khuyến nghị đọc theo thứ tự 4 bước sau:

### Bước 1: Đọc Hợp đồng dữ liệu chung (Bắt buộc cho cả Frontend & Backend)
- **Tệp cần đọc:**
  - Frontend: `apps/web/types/brewlite.ts`
  - Backend: `apps/api/src/common/types/brewlite.ts`
- **Mục đích:** Nắm rõ các định nghĩa Enum chuẩn (`OrderStatus`, `PaymentMethod`, `PaymentStatus`, `Size`, `Role`, `DiscountType`) và các cấu trúc dữ liệu (`Product`, `CartItem`, `Order`, `OrderDetail`, `User`, `Payment`, `Voucher`).
- **Ý nghĩa:** Đây là "tiếng nói chung" của cả dự án. Khi Frontend và Backend dùng chung interface, quá trình ráp nối API khớp chính xác tên trường (ví dụ: `productId` thay vì `product_id`).

### Bước 2: Đọc Logic tính giá độc lập
- **Tệp cần đọc:**
  - Frontend: `apps/web/utils/pricing.ts`
  - Backend: `apps/api/src/common/utils/pricing.util.ts`
- **Mục đích:** Xem hàm `calculateItemPrice(basePrice, size, toppings)` (trong đó ở CSDL mỗi sản phẩm lưu riêng `priceS`, `priceM`, `priceL` và cộng dồn giá topping).
- **Ý nghĩa:** Quy tắc tính giá được tập trung rõ ràng và luôn được Backend tính lại để bảo toàn tính chính xác của đơn hàng.

### Bước 3: Đọc Backend Core & Các Module nghiệp vụ
- **Tệp cần đọc:**
  1. `apps/api/src/common/entities/base.entity.ts`: Lớp trừu tượng `BaseEntity` cung cấp các trường nền tảng `id`, `createdAt`, `updatedAt`.
  2. `apps/api/src/common/filters/http-exception.filter.ts`: Bộ lọc `AllExceptionsFilter` bắt lỗi toàn cục và trả về JSON chuẩn `{ statusCode, message, timestamp, path }`.
  3. `apps/api/src/main.ts`: Cấu hình cổng `8080`, CORS, `ValidationPipe` (`whitelist: true, transform: true, forbidNonWhitelisted: true`) và Swagger `/swagger`.
  4. `apps/api/src/health/health.controller.ts`: Endpoint `GET /health` làm ví dụ mẫu cho Controller NestJS.
  5. Tiếp tục đọc sâu các module: `auth/`, `products/`, `orders/`, `payments/`, `promotions/`, `inventory/`.

### Bước 4: Đọc Frontend Core & App Router
- **Tệp cần đọc:**
  1. `apps/web/app/layout.tsx`: Khung giao diện gốc đã nhúng sẵn Header và BottomNav.
  2. `apps/web/components/Header.tsx`, `apps/web/components/BottomNav.tsx` và `apps/web/stores/cartStore.ts`: Cơ chế đồng bộ giỏ hàng và Cart Badge.
  3. `apps/web/utils/apiClient.ts`: Wrapper gọi API tự động đính kèm `Authorization: Bearer <token>`.

---

## 4. ĐỐI CHIẾU VỚI YÊU CẦU TRONG ĐỀ BÀI (ASSIGNMENT 2)

Những thành phần nền tảng và tích hợp giải quyết trực tiếp các tiêu chí kỹ thuật trong tài liệu đề bài:

| Mã yêu cầu trong đề tài | Tên yêu cầu / Tiêu chí | Mã nguồn đã giải quyết như thế nào? |
| :--- | :--- | :--- |
| **Mục 4.1 & ADR-001** | Cấu trúc Monorepo & Quy chuẩn kho mã | Tổ chức thư mục `apps/api/`, `apps/web/`, `docs/`, `tests/`, cấu hình `.gitignore` và `.env.example` chuẩn mực. |
| **Task 2.3 & Data Dict** | Sơ đồ lớp miền (Domain Class Diagram) | Toàn bộ Enums và Interfaces trong `types/brewlite.ts` và `apps/api/prisma/schema.prisma` khớp với `docs/diagrams/class-domain.md`. |
| **Mục 7 (Wireframe PDF)** | Giao diện Mobile-first & Thanh điều hướng | `layout.tsx` chuẩn responsive, `Header.tsx` có Logo BrewLite, `BottomNav.tsx` có thanh điều hướng các tab chính. |
| **FR-11 & AC-11.1** | Giỏ hàng & Badge số lượng món | `Header.tsx`, `BottomNav.tsx` và `cartStore.ts` tích hợp Cart Badge tự ẩn khi giỏ rỗng, hiển thị số lượng khi có món (`99+` khi vượt ngưỡng). |
| **NFR-07 & NFR-09** | An toàn thông tin & Che giấu chi tiết lỗi | `AllExceptionsFilter` bắt mọi ngoại lệ chưa xử lý, trả mã lỗi HTTP chuẩn và ẩn hoàn toàn stack trace khỏi môi trường vận hành. |
| **NFR-08** | Tính toàn vẹn dữ liệu đầu vào | `ValidationPipe` kích hoạt ở `main.ts` (`whitelist: true, transform: true, forbidNonWhitelisted: true`), tự loại bỏ và chặn các trường lạ không khai báo trong DTO. |
| **Task 3.1 & Task 5.2** | Kiểm tra sức khỏe dịch vụ (Health Check) | Endpoint `GET /health` cung cấp thông tin liveness, `service`, `uptime`, `timestamp`, `environment` phục vụ Render/Docker healthcheck; kèm Unit test pass 100%. |

---

## 5. LƯU Ý KHI LÀM VIỆC VỚI GIT

1. **Nhánh làm việc:** Các thành viên làm việc trên nhánh chức năng (`TV1`..`TV7`), đồng bộ mã nguồn mới nhất từ nhánh `main` trước khi mở Pull Request.
2. **Quy ước Commit:** Tuân thủ đúng tiền tố trong `README.md`:
   - `[Feat]: Thêm một tính năng mới (feature).`
   - `[Fix]: Sửa lỗi (bug fix).`
   - `[Docs]: Thay đổi chỉ liên quan đến tài liệu (documentation).`
   - `[Style]: Thay đổi định dạng, khoảng trắng... không làm thay đổi logic code.`
   - `[Refactor]: Tái cấu trúc code (không sửa lỗi cũng không thêm tính năng).`
   - `[Perf]: Cải thiện hiệu năng.`
   - `[Test]: Thêm hoặc sửa test.`
   - `[Chore]: Các việc vặt không sửa source code hay file test (ví dụ cập nhật build task).`
3. **Không chỉnh sửa các file dùng chung nếu chưa thống nhất:** Nếu cần thay đổi schema/types trong `apps/api/prisma/schema.prisma` hoặc `types/brewlite.ts`, cần đồng bộ cả Frontend, Backend và tài liệu `docs/diagrams/class-domain.*`.
