# Bối cảnh, Stakeholder và Phạm vi dự án (Task 1.1)

- **Dự án:** BrewLite — Ứng dụng đặt cà phê không dùng tiền mặt
- **Môn học:** Công nghệ Phần mềm, Trường Đại học Sài Gòn
- **Phương pháp phát triển:** Agile Scrum

---

## 1. Phân tích vấn đề nghiệp vụ BrewLite 

Khách hàng mua đồ uống hiện nay gặp bất tiện do mất thời gian xếp hàng tại quầy và quy trình thanh toán bằng tiền mặt kém hiệu quả. BrewLite được định hướng phát triển là ứng dụng đặt cà phê hướng tới mô hình giao dịch **không dùng tiền mặt** để giải quyết vấn đề này với tầm nhìn:

> *"BrewLite giúp khách hàng đặt và thanh toán đồ uống trực tuyến chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."*

Toàn bộ quy trình trải dài từ lúc người dùng chọn sản phẩm trên hệ thống đến lúc hoàn tất thanh toán trực tuyến và nhận đồ uống tại quầy.

---

## 2. Bảng Stakeholders

| Bên liên quan | Vai trò và trách nhiệm | Mục tiêu và kỳ vọng |
| :--- | :--- | :--- |
| **Khách hàng** | Đặt đồ uống, chọn size/topping, thanh toán không tiền mặt và theo dõi trạng thái đơn hàng. | Hoàn tất thao tác mua hàng chỉ trong vài chạm, loại bỏ việc xếp hàng chờ đợi và nhận đồ uống nhanh chóng tại quầy. |
| **Nhân viên quầy / Barista** | Tiếp nhận đơn đặt hàng từ hệ thống và cập nhật trạng thái pha chế thực tế. | Có công cụ hiển thị thông tin đặt món chính xác để pha chế đúng tùy chọn, giúp quản lý luồng đơn hiệu quả. |
| **Quản lý cửa hàng / Product Owner** | Xác định yêu cầu nghiệp vụ hệ thống, sắp xếp thứ tự và phân tích mức độ ưu tiên cho Product Backlog và nghiệm thu Increment phần mềm sau mỗi Sprint. | Đảm bảo sản phẩm bám sát tầm nhìn kinh doanh ban đầu và các tính năng được phát triển đúng tiến độ. |
| **Giảng viên / Khách hàng nghiệm thu** | Đánh giá toàn bộ quy trình phát triển, chất lượng sản phẩm cuối cùng và mức độ đáp ứng các tiêu chí chấp nhận. | Xác nhận nhóm tuân thủ đúng yêu cầu kiến trúc bắt buộc (NestJS, Next.js, PostgreSQL), thiết lập thành công CI/CD và triển khai được trên môi trường production. |
| **Nhóm phát triển** | Phân tích yêu cầu nghiệp vụ, thiết kế kiến trúc hệ thống, lập trình, kiểm thử và thực hiện bàn giao hệ thống. | Hoàn thành các hạng mục đạt chuẩn Definition of Done (DoD), tối ưu được nghiệp vụ xử lý backend chuyên sâu và nghiệm thu dự án thành công. |
| **Đơn vị thanh toán** | Cung cấp hoặc mô phỏng cổng giao dịch thông qua nền tảng Ví điện tử hoặc Thẻ ngân hàng trong phạm vi dự án. | Hệ thống đối tác (BrewLite) truyền và gọi API ổn định, tích hợp thành công cơ chế idempotent để chặn các lỗi trừ tiền trùng lặp khi có sự cố mạng. |

---

## 3. Xác định danh mục phạm vi

### 3.1. In-scope (Trong phạm vi)
- **Core Checkout MVP (Đặt hàng & Thanh toán không tiền mặt cho Khách hàng):**
  - Hiển thị danh sách đồ uống (menu) theo danh mục, hình ảnh, tên và mức giá tương ứng.
  - Xem chi tiết sản phẩm (`/products/[id]`), chọn kích cỡ (`S`, `M`, `L`) và các loại topping.
  - Thao tác giỏ hàng (`/cart`): thêm, sửa số lượng, xóa món và tính tạm tính qua Zustand store.
  - Đăng ký (`/register`), đăng nhập (`/login`) và quản lý hồ sơ (`/UserProfile`) với xác thực JWT và phân quyền RBAC (`CUSTOMER`, `BARISTA`, `ADMIN`).
  - Khởi tạo đơn hàng idempotent (`Idempotency-Key`), xử lý thanh toán không dùng tiền mặt qua `VNPAY` Sandbox hoặc `MOCK`, tự động hết hạn đơn chưa thanh toán sau cửa sổ 10 phút (`ORDER_PAYMENT_WINDOW_MS`).
  - Hiển thị màn hình chi tiết đơn hàng (`/orders/[id]`) và lịch sử đặt hàng của khách hàng (`/orders`).
- **Implemented Phase 2 / Staff Portal, Kho & Khuyến mãi (Đã triển khai):**
  - **Staff Portal (`/staff` dành cho `BARISTA` / `ADMIN`):** Theo dõi toàn bộ đơn hàng (`GET /orders/staff/all`) và cập nhật trạng thái pha chế theo Order State Machine (`PAID` → `PREPARING` → `READY` → `COMPLETED`).
  - **Quản lý kho nguyên liệu & công thức (`InventoryModule`):** Quản lý nguyên liệu (`Ingredient`), công thức định lượng theo size (`RecipeItem`), tự động trừ nguyên liệu khi đơn chuyển sang `PAID`/`PREPARING`, tính lại tồn kho sản phẩm (`recalculate-stock`) và ghi nhận nhật ký kho (`IngredientAuditLog`).
  - **Hủy đơn & Duyệt hoàn tiền:** Khách hàng hủy đơn (`POST /orders/:id/cancel` — hủy trực tiếp nếu `PENDING`/`PAYMENT_FAILED` hoặc tạo `RefundRequest` nếu đã `PAID`); Nhân viên/Admin duyệt hoàn tiền (`POST /orders/:id/approve-refund`).
  - **Khuyến mãi & Điểm thưởng Loyalty (`PromotionsModule`):** Danh sách & áp dụng voucher (`GET /promotions/vouchers`, `POST /promotions/apply`), tích điểm thưởng (`10.000đ = 1 điểm`) và đổi điểm lấy voucher (`POST /promotions/redeem-points` với `REWARD10K`, `REWARD20K`, `REWARD50K`).

### 3.2. Out-of-scope (Ngoài phạm vi)
- Thanh toán tiền mặt hoặc thu hộ khi nhận hàng (COD) — hệ thống vận hành 100% không dùng tiền mặt.
- Tích hợp cổng thanh toán giao dịch tiền thật trên môi trường thương mại (chỉ sử dụng VNPay Sandbox và Mock Payment Adapter).
- Tích hợp đơn vị vận chuyển/tài xế giao hàng bên thứ ba hoặc ứng dụng di động native iOS/Android riêng biệt (giao diện web theo hướng mobile-first).
> *Ghi chú đồng bộ:* Chức năng thao tác của Nhân viên quầy/Barista (Staff Portal `/staff`, cập nhật trạng thái pha chế, quản lý kho và duyệt hoàn tiền) đã được đưa vào phạm vi triển khai Phase 2 và hoàn thiện trong mã nguồn hiện tại.

### 3.3. Giả định (Assumptions)
- Giao dịch trực tuyến bên ngoài được thực hiện qua cấu hình cổng thanh toán `VNPAY` Sandbox (HMAC-SHA512, Return URL/IPN) hoặc `MOCK` Payment Adapter (`PAYMENT_PROVIDER`), không phát sinh giao dịch tiền thật.
- Hệ thống đáp ứng tiêu chuẩn hiệu năng với thời gian phản hồi API dưới 500ms khi truy xuất cơ sở dữ liệu mẫu.
- Giao diện ứng dụng hoạt động tương thích và ổn định trên các trình duyệt web tiêu chuẩn (desktop & mobile responsive).

### 3.4. Ràng buộc (Constraints)

| Phân loại | Nội dung ràng buộc cụ thể | Cơ sở / Tiêu chuẩn áp dụng |
| :--- | :--- | :--- |
| **Công nghệ bắt buộc** | - **Frontend:** Next.js (React 19, TypeScript, TailwindCSS) theo định hướng Mobile-first / PWA.<br>- **Backend:** NestJS (TypeScript) theo kiến trúc Modular Monolith và chuẩn RESTful API.<br>- **Cơ sở dữ liệu:** PostgreSQL 16+ kết hợp Prisma ORM và cơ chế Migration tự động.<br>- **Môi trường:** Docker & Docker Compose chạy cục bộ 3 thành phần (web, api, db). | Quy định tại Mục 1.1 và Mục 6 của đề bài Assignment 2 (không được phép thay thế 3 thành phần cốt lõi này). |
| **Nghiệp vụ thanh toán** | - **100% Cashless:** Chỉ hỗ trợ thanh toán trực tuyến qua Ví điện tử hoặc Thẻ ngân hàng (mô phỏng hoặc sandbox); không hỗ trợ thanh toán tiền mặt hay COD.<br>- **Tính toán an toàn:** Toàn bộ thành tiền, giảm giá voucher và tổng tiền đơn hàng phải tính toán và xác thực tại Backend, không tin cậy dữ liệu client gửi lên.<br>- **Giao dịch Idempotent:** Bắt buộc truyền `Idempotency-Key` (UUID v4) khi tạo đơn và thanh toán để chống trừ tiền/tạo đơn trùng lặp khi mạng bị chập chờn. | Yêu cầu nghiệp vụ cốt lõi của đề tài BrewLite và tiêu chuẩn chống gian lận thương mại điện tử. |
| **Bảo mật & Hiệu năng** | - **Bảo mật mật khẩu:** Bắt buộc băm mật khẩu bằng thuật toán chuyên dụng (`bcrypt`) với salt trước khi lưu vào CSDL, tuyệt đối không lưu plain text hay ghi log.<br>- **Xác thực JWT:** Bảo vệ các endpoint nhạy cảm (`/orders`, `/payments`, `/orders/me`) qua JWT Bearer Token hợp lệ.<br>- **Hiệu năng API:** Tối thiểu 95% yêu cầu đến các API chính phải phản hồi dưới 500ms đối với dữ liệu mẫu. | Yêu cầu phi chức năng NFR-01, NFR-03, NFR-05 và NFR-07 trong tài liệu SRS. |
| **Quy trình & Đóng gói** | - **Agile Scrum tuần tự:** Thực hiện dự án qua 2 Sprint tuần tự. Task sau chỉ được nghiệm thu khi tạo phẩm bắt buộc của task trước đã có trên repository với lịch sử commit rõ ràng.<br>- **Chất lượng mã nguồn (DoD):** Mọi đóng góp phải thông qua Pull Request, vượt qua 100% các bước Lint, Unit Test và Build trên GitHub Actions CI trước khi merge. | Quy định tại Mục 1 và Mục 4.4 / 6.3 của đề bài Assignment 2. |

### 3.5. Rủi ro (Risks)
- Quá trình xử lý giao dịch thanh toán của người dùng bị lỗi khiến hệ thống chuyển đơn hàng sang trạng thái `PAYMENT_FAILED`.
- Xảy ra tình trạng bán vượt quá số lượng nguyên liệu thực tế (overselling) do sai lệch dữ liệu tồn kho khi nhiều khách hàng thao tác đặt mua hàng cùng một thời điểm.
