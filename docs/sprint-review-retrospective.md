# Báo cáo sprint review và retrospective

## 1. Thông tin chung về sprint

- Dự án: BrewLite — Hệ thống đặt cà phê trực tuyến không dùng tiền mặt
- Sprint: Sprint 2 (Nền tảng cơ sở dữ liệu, CI/CD pipeline và tài liệu kỹ thuật)
- Thời gian thực hiện: 2 tuần
- Phương pháp phát triển: Agile Scrum
- Nhóm thực hiện: Nhóm phát triển môn Công nghệ phần mềm SGU

## 2. Sprint review

### 2.1. Mục tiêu sprint
Hoàn thiện kiến trúc cơ sở dữ liệu cho các chức năng thanh toán và khuyến mãi, cấu hình tự động hóa quy trình kiểm thử và triển khai bằng GitHub Actions, đồng thời đồng bộ hóa toàn bộ hồ sơ tài liệu phục vụ nghiệm thu.

### 2.2. Kết quả nghiệm thu các hạng mục

| Hạng mục công việc        | Yêu cầu kỹ thuật                                                            | Trạng thái | Ghi chú kỹ thuật                                             |
| :------------------------ | :-------------------------------------------------------------------------- | :--------- | :----------------------------------------------------------- |
| Cập nhật Prisma Schema    | Tạo bảng Payment, Voucher, LoyaltyTransaction; thêm cột version cho Product | Hoàn thành | Đã tạo migration 20261102193258_init_payment_voucher         |
| Nạp dữ liệu mồi           | Nạp 3 mã voucher mẫu: WELCOME10, BREW20K, FREESHIP                          | Hoàn thành | Thực thi lệnh nạp qua seed.ts bằng cờ transpile-only         |
| Tự động hóa CI Pipeline   | Chạy linter, unit test và build ứng dụng trên GitHub Actions                | Hoàn thành | Chuẩn hóa môi trường về Node.js 20 LTS và PostgreSQL service |
| Tự động hóa CD Pipeline   | Tạo webhook kích hoạt build và deploy lên nền tảng đám mây                  | Hoàn thành | Thiết lập tệp cấu hình .github/workflows/cd.yml              |
| Cập nhật ma trận truy vết | Ánh xạ mã nguồn và kiểm thử cho các yêu cầu FR và NFR                       | Hoàn thành | Hoàn thiện tệp Docs/traceability-matrix.md với mã T01-T36    |
| Khởi chạy container CSDL  | Thiết lập môi trường PostgreSQL độc lập cục bộ                              | Hoàn thành | Dịch vụ chạy qua Docker Compose trên cổng 5432               |

### 2.3. Đánh giá hoàn thành mục tiêu
Nhóm đã hoàn thành toàn bộ các yêu cầu đặt ra cho Sprint 2. Cơ sở dữ liệu phản ánh đầy đủ mô hình dữ liệu miền và đáp ứng yêu cầu kiểm soát đồng thời khi cập nhật đơn hàng. Hệ thống CI/CD sẵn sàng cho việc kiểm tra chất lượng mã nguồn tự động khi tích hợp vào nhánh chính.

## 3. Sprint retrospective

### 3.1. Những điểm đã làm tốt
Cấu trúc cơ sở dữ liệu được mở rộng chính xác qua Prisma Migration, không gây xung đột với các bảng đã tạo ở Sprint 1.

Môi trường kiểm thử tự động của GitHub Actions được tích hợp dịch vụ PostgreSQL thực tế, ngăn ngừa lỗi sập kết nối khi chạy kiểm thử tích hợp.

Ma trận truy vết được chuẩn hóa đầy đủ, liên kết chặt chẽ giữa các yêu cầu trong tài liệu đặc tả với mã nguồn và kịch bản kiểm thử tương ứng.

### 3.2. Khó khăn và tồn tại kỹ thuật
Trình biên dịch ts-node gặp lỗi kiểm tra kiểu dữ liệu với Prisma Client trên môi trường Windows, cần sử dụng cờ bỏ qua kiểm tra kiểu để hoàn tất việc nạp dữ liệu.

Cấu hình phiên bản Node.js ban đầu trên pipeline CI bị lệch so với cấu hình máy cục bộ, gây nguy cơ sai lệch môi trường thực thi.

Quá trình kiểm thử luồng CD tự động phụ thuộc vào các biến bí mật (secrets) từ nhà cung cấp dịch vụ đám mây chưa được cấu hình đầy đủ ở kho lưu trữ cục bộ.

### 3.3. Kế hoạch cải tiến cho sprint tiếp theo
Cấu hình bổ sung tệp định nghĩa kiểu dữ liệu trong thư mục backend để xử lý dứt điểm cảnh báo biên dịch khi chạy trực tiếp các lệnh ts-node.

Bổ sung đầy đủ các khóa Webhook trên mục Settings của kho lưu trữ GitHub để kiểm thử toàn diện luồng kích hoạt deploy tự động sau khi gắn tag phiên bản v1.0.0.

Triển khai các ca kiểm thử tích hợp cho dịch vụ xử lý thanh toán và áp dụng mã khuyến mãi trên nền tảng cơ sở dữ liệu mới.