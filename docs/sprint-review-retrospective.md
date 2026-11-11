# Báo cáo Tổng kết Sprint: Sprint Review & Retrospective
## Dự án BrewLite — Nền tảng Đặt Cà phê Trực tuyến Không Dùng Tiền Mặt

Tài liệu này tổng hợp toàn bộ biên bản họp **Sprint Review** và **Sprint Retrospective** cho cả hai giai đoạn phát triển (**Sprint 1** và **Sprint 2**), đáp ứng yêu cầu nghiệm thu tại **Task 5.4 và Mục 9.1** của đề bài Assignment 2.

- **Phương pháp phát triển:** Agile Scrum
- **Đơn vị thực hiện:** Nhóm phát triển Công nghệ Phần mềm — Trường Đại học Sài Gòn (SGU)
- **Chu kỳ Sprint:** 02 tuần / Sprint

---

## PHẦN 1: TỔNG KẾT SPRINT 1 (MVP MENU & NỀN TẢNG KỸ THUẬT)

### 1.1. Thông tin chung Sprint 1
- **Mục tiêu Sprint (Sprint Goal):** Tạo nền tảng kỹ thuật Monorepo, thiết lập hệ thống tài liệu có kiểm soát phiên bản bằng Git, và xây dựng phiên bản MVP đầu tiên chạy được cho luồng xem thực đơn đồ uống.
- **Thời gian thực hiện:** 21/10/2026 – 04/11/2026.

### 1.2. Kết quả Nghiệm thu Tính năng (Sprint 1 Review)

| Hạng mục công việc | Yêu cầu kỹ thuật | Trạng thái | Ghi chú nghiệm thu |
| :--- | :--- | :---: | :--- |
| **Cấu trúc Monorepo** | Phân tách `apps/api/` (NestJS), `apps/web/` (Next.js) và `docs/` | Hoàn thành | Thiết lập cấu trúc chuẩn theo ADR-001 |
| **Cơ sở dữ liệu nền tảng** | Khởi tạo mô hình Category, Product, User bằng Prisma ORM | Hoàn thành | Chạy thành công migration khởi tạo ban đầu |
| **API Thực đơn đồ uống** | Endpoint `GET /products` và `GET /products/:id` | Hoàn thành | Trả về danh sách đồ uống kèm giá theo size chuẩn |
| **Giao diện Web MVP** | Next.js App Router, bố cục dạng lưới mobile-first | Hoàn thành | Khách hàng duyệt menu, lọc danh mục, xem tồn kho |
| **Tài liệu Thiết kế UML** | Hoàn thành SRS, Use Case tổng quát, Activity, Sequence, Class | Hoàn thành | Lưu trữ dạng mã nguồn `.puml` và ảnh vector `.svg` |
| **Tích hợp CI sơ khởi** | Thiết lập GitHub Actions tự động kiểm tra cú pháp và build | Hoàn thành | Pipeline `.github/workflows/ci.yml` hoạt động ổn định |

### 1.3. Đánh giá & Rút kinh nghiệm (Sprint 1 Retrospective)
- **Điểm làm tốt:**
  - Nhóm hoàn thành đúng hạn mục tiêu Sprint Goal; MVP chạy thực tế, không dùng mockup tĩnh.
  - Phân chia module rõ ràng theo nguyên lý Clean Architecture.
- **Khó khăn & Tồn tại:**
  - Quy ước đặt tên commit ban đầu giữa các thành viên chưa đồng nhất.
  - Quá trình cấu hình biến môi trường cục bộ giữa Frontend và Backend còn phải sửa thủ công nhiều lần.
- **Kế hoạch cải tiến cho Sprint 2:**
  - Bắt buộc áp dụng 100% quy ước Conventional Commits (`[Feat]`, `[Fix]`, `[Docs]`, `[Test]`, `[Chore]`).
  - Chuẩn hóa các tệp `.env.example` và quy trình kiểm thử tự động trước khi merge code.

---

## PHẦN 2: TỔNG KẾT SPRINT 2 (END-TO-END FLOW, CI/CD & DELIVERY)

### 2.1. Thông tin chung Sprint 2
- **Mục tiêu Sprint (Sprint Goal):** Hoàn thiện trọn vẹn luồng người dùng End-to-End (tùy chọn size/topping, giỏ hàng, đặt đơn, thanh toán VNPay Sandbox, xác nhận đơn), tự động hóa toàn bộ quy trình CI/CD và kiểm thử tích hợp, sẵn sàng bàn giao phiên bản Production.
- **Thời gian thực hiện:** 05/11/2026 – 11/11/2026.

### 2.2. Kết quả Nghiệm thu Tính năng (Sprint 2 Review)

| Hạng mục công việc | Yêu cầu kỹ thuật | Trạng thái | Ghi chú nghiệm thu |
| :--- | :--- | :---: | :--- |
| **Tùy chọn Size & Topping** | Cho phép chọn size S/M/L và các loại topping kèm giá riêng | Hoàn thành | Logic tính toán nhất quán ở cả Client và Server |
| **Giỏ hàng & Badge số lượng** | Quản lý giỏ bằng Zustand Store, tính tổng tiền tự động | Hoàn thành | Giao diện mobile-first mượt mà, phản hồi tức thì |
| **Xác thực JWT & Phân quyền** | Đăng ký, đăng nhập bảo mật với mật khẩu băm Bcrypt | Hoàn thành | Bảo vệ endpoint bằng `JwtAuthGuard` và `RolesGuard` |
| **Tạo đơn hàng & Chống trùng** | Endpoint `POST /orders` hỗ trợ header `Idempotency-Key` | Hoàn thành | Chống tạo trùng đơn khi bấm lặp hoặc mạng chập chờn |
| **Cổng thanh toán VNPay** | Endpoint `POST /payments` tích hợp chữ ký HMAC-SHA512 | Hoàn thành | Xử lý IPN callback, đối soát tự động khi đơn chuyển `PAID` |
| **Máy trạng thái đơn hàng** | 7 trạng thái chuẩn và cơ chế tự hủy đơn hết hạn sau 15 phút | Hoàn thành | Triển khai theo ADR-003, bảo toàn kho hàng an toàn |
| **Kiểm thử Toàn diện** | Unit, Integration, E2E Runner và Client payment tests | Hoàn thành | 326 tests API + 28 tests Web pass 100% |
| **Tự động hóa CD Pipeline** | Pipeline 4 giai đoạn: Quality Gate $\rightarrow$ Build $\rightarrow$ Deploy $\rightarrow$ Smoke Test | Hoàn thành | Tệp `.github/workflows/cd.yml` cấu hình hoàn chỉnh |
| **Ma trận Truy vết (RTM)** | Ánh xạ 100% 16 FRs và 20 NFRs với test thực tế | Hoàn thành | `docs/traceability-matrix.md` chuẩn hóa tiền tố kiểm thử |
| **Hướng dẫn Rollback** | 4 kịch bản ứng phó sự cố (PaaS, Docker, Git Revert, Migration) | Hoàn thành | Bổ sung đầy đủ tại Mục 9 của `README.md` |

### 2.3. Đánh giá & Rút kinh nghiệm (Sprint 2 Retrospective)
- **Điểm làm tốt:**
  - Hệ thống đạt độ tin cậy rất cao: 326 bài kiểm thử Backend và 28 bài kiểm thử Frontend đạt tỷ lệ vượt qua **100%**.
  - Pipeline CI/CD tự động hóa chặt chẽ, bảo vệ nhánh `main` không bị nhiễm lỗi.
  - Ma trận truy vết hai chiều (RTM) liên kết minh bạch từ tài liệu yêu cầu đến dòng mã nguồn và ca kiểm thử cụ thể.
  - Cơ chế xử lý thanh toán ngoại lệ (Delayed IPN callback) và kiểm soát tồn kho đồng thời (Optimistic Locking) được thiết kế vững chắc.
- **Khó khăn & Thách thức kỹ thuật:**
  - Cơ chế đồng bộ trạng thái thanh toán từ Webhook VNPay Sandbox qua localhost đòi hỏi phải thiết lập Cloudflare Tunnel trung gian.
  - Hệ thống build Next.js 16.4 hiển thị thông báo bảo mật ở lần chạy đầu tiên, cần xử lý cấu hình build thông minh để pipeline CI/CD chạy mượt mà.
- **Bài học kinh nghiệm cho vận hành thực tế:**
  - Luôn duy trì chiến lược kiểm thử tự động hóa (Test Automation) làm chốt chặn chất lượng trước khi phát hành bất kỳ tính năng mới nào.
  - Quản lý chặt chẽ biến môi trường bí mật qua GitHub Secrets và cấu hình độc lập giữa môi trường Local, Staging và Production.
