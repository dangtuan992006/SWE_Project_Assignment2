# Hủy đơn và hoàn bằng điểm — BrewLite

## Chính sách hiện tại

- Chỉ khách sở hữu đơn `PAID`, chưa pha chế được gửi yêu cầu. ADMIN/BARISTA duyệt hoặc từ chối.
- **1 điểm = 1.000đ, phần lẻ làm tròn lên.** Công thức `ceil(số tiền thực trả / 1000)`. Ví dụ 50.000đ → 50 điểm, 50.001đ → 51 điểm.
- Hoàn vào cùng số dư `User.loyaltyPoints`, dùng đổi voucher trong Tài khoản; không gọi API Refund VNPay, không chuyển về thẻ/ngân hàng.
- Chính sách áp dụng cho đơn thanh toán gốc bằng VNPay hoặc Mock. Chuyển `PAYMENT_PROVIDER` không đổi cách hoàn điểm.
- Đây không phải tỷ lệ tích điểm thưởng: tích điểm mua hàng hiện là 10.000đ/điểm. Điểm thưởng EARN của đơn hủy được thu hồi riêng trước khi cộng điểm hoàn.
- Ví dụ số dư ban đầu 0, đơn 50.000đ nhận 5 điểm thưởng. Khi duyệt hoàn: thu hồi 5 và cộng 50, số dư cuối là 50. Nếu điểm thưởng đã dùng, khoản thu hồi vẫn ghi nhận để tránh giữ thưởng của đơn hủy.
- Điểm hoàn không có hạn riêng; voucher đổi bằng điểm hiện có hạn 30 ngày, đơn tối thiểu gấp đôi mệnh giá voucher. Cơ chế đổi voucher được giữ như hiện tại.

## Chạy ứng dụng

Trong `apps/api`, cấu hình `.env` đúng DATABASE_URL, JWT_SECRET và cấu hình thanh toán hiện có:

```powershell
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Trong `apps/web`:

```powershell
npm ci
npm run dev
```

Migration mới `20261112090000_add_refund_credit_type` và `20261112090100_add_points_refunds` chỉ bổ sung enum/trường/index; không sửa migration cũ, không cần reset DB. Migration giữ lịch sử cũ là CASH; chỉ chuyển yêu cầu PENDING chưa có lượt gửi sang POINTS.

Refund không cần cấu hình/tunnel VNPay riêng. Nếu vẫn thanh toán đơn mới qua VNPay thì giữ cấu hình checkout/Return/IPN như trước. Tạo đơn thanh toán Mock để thử trước cũng được, việc hoàn điểm sử dụng cùng logic.

## Cách kiểm tra thủ công

1. Khách tạo và thanh toán đơn, thấy PAID. Ghi lại số điểm trước/sau thanh toán.
2. Mở chi tiết, chọn **Yêu cầu hủy đơn và hoàn điểm**, đọc tỷ lệ/điều kiện, nhập lý do.
3. Staff vào `/staff` → làm mới → xem số điểm dự kiến → **Duyệt và hoàn điểm**.
4. Đơn thành CANCELLED, RefundRequest SUCCEEDED/POINTS có `refundPoints`/`vndPerPoint`, lịch sử REFUND_CREDIT số dương. Mở Tài khoản để xem số dư mới.
5. Payment gốc **vẫn SUCCESS, refundedAt không thay đổi**: tiền đã thu và chưa hoàn qua ngân hàng. Không đọc Payment.SUCCESS để kết luận chưa hoàn điểm; xem RefundRequest.
6. Bấm duyệt lại hoặc hai staff duyệt đồng thời: chỉ cộng điểm một lần, không trả kho/voucher thêm lần nữa.
7. Thử từ chối: đơn vẫn PAID, pha chế lại được; sau PREPARING không yêu cầu hoàn được.

## Giao dịch và nhật ký

- Duyệt, hủy đơn, trả kho/voucher, thu hồi thưởng, cộng điểm hoàn và ghi kết quả nằm trong một transaction có khóa order. Lỗi ở bất cứ bước nào rollback toàn bộ, yêu cầu còn PENDING để thử lại an toàn.
- `RefundRequest.refundMethod=POINTS`, `refundPoints`, `vndPerPoint` lưu chính sách/giá trị thực tế. `provider` chỉ nhà cung cấp thanh toán gốc.
- Ledger `REFUND` số âm thu hồi thưởng EARN; ledger `REFUND_CREDIT` số dương cộng điểm hoàn. Index chống hai REFUND_CREDIT cho cùng đơn.
- Kho sản phẩm trả theo order items; nguyên liệu trả theo snapshot lúc thanh toán, không suy đoán từ recipe hiện tại. Đơn cũ thiếu snapshot cần nhân viên kiểm kê nguyên liệu thủ công. Không trừ nguyên liệu thêm khi chuyển PREPARING.
- Điểm không đủ/overflow, giao dịch thu tiền không khớp, nhiều giao dịch SUCCESS hoặc trạng thái đơn thay đổi đều chặn duyệt; frontend không được quyết định số điểm/tỷ lệ.

## Các lượt hoàn tiền cũ

Không tự cộng điểm cho CASH/PROCESSING, UNKNOWN hoặc APPROVED cũ. Phải kiểm tra giao dịch hoàn với VNPay/ngân hàng, đúng giao dịch gốc/số tiền; SUCCESS của thanh toán gốc không chứng minh đã hoàn tiền.

Endpoint `POST /orders/:id/resolve-refund` chỉ giữ để kết thúc lượt CASH cũ đang PROCESSING/UNKNOWN, cần chứng từ và ít nhất 60 giây từ lúc gửi. Xác nhận SUCCEEDED cũ thì giữ lịch sử hoàn CASH, không cộng điểm; nếu đã xác nhận FAILED thì staff có thể chọn **Hoàn bằng điểm**. Không dùng endpoint này cho yêu cầu POINTS.

Các lượt CASH đã SUCCEEDED được giữ nguyên, bấm lại không cộng điểm. Không có luồng gửi yêu cầu hoàn VNPay mới.

## Test tự động

```powershell
cd apps/api
npm test -- --runInBand
npm run build
# Tạo .env.test từ .env.test.example, trỏ DB riêng brewlite_test
npm run test:e2e -- --runInBand
```

```powershell
cd apps/web
npm run test:refunds
npm run test:vnpay
npm run build
```

E2E dùng PostgreSQL riêng, chặn mọi fetch ra gateway, kiểm tra cộng điểm, làm tròn, bấm lặp/duyệt đồng thời, rollback, quyền, race pha chế và lịch sử CASH. Không sửa DB ứng dụng khi chạy trên DB test.

Next.js 16.4.0 hiện có cảnh báo bảo mật khi build/dev; thay đổi hoàn điểm không tự nâng framework.
