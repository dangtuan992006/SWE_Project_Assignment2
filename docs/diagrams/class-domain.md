# Từ điển dữ liệu và trách nhiệm các lớp — BrewLite

## 1. Quy ước

Quy ước:

- `-`: thuộc tính private.
- `+`: phương thức public.
- `{static}`: phương thức thuộc lớp.
- `[0..1]`: có thể không có giá trị (nullable trong `schema.prisma`).
- `Decimal`: kiểu số thập phân chính xác dùng cho tiền và định lượng nguyên liệu (`@db.Decimal(10, 2)`).
- `DateTime`: thời điểm được lưu theo quy ước múi giờ thống nhất (`UTC` trong PostgreSQL).
- Quan hệ giữa các đối tượng được thể hiện bằng association trong UML (`class-domain.puml`); không lặp lại toàn bộ khóa ngoại trong danh sách thuộc tính trừ trường hợp snapshot tham chiếu như `IngredientAuditLog.ingredientId`.
- `toppingOptions` và `selectedToppings` là mảng JSON; mảng rỗng `[]` biểu thị không có topping.
- Giỏ hàng (Cart) không được mô hình hóa thành bảng CSDL vì giỏ hàng được giữ ở phía client (`apps/web/stores/cartStore.ts`, `localStorage`). Chỉ khi khách xác nhận đặt hàng, nội dung giỏ mới được gửi lên backend để tạo `Order` và `OrderItem`.

## 2. Mô tả các lớp (đối chiếu 100% với `apps/api/prisma/schema.prisma`)

### 2.1.1. Lớp Category

**Tác dụng:** Phân nhóm các đồ uống trên thực đơn (`products`).

| STT | Tên thuộc tính | Kiểu          | Ràng buộc          | Ý nghĩa / Ghi chú          |
| --- | -------------- | ------------- | ------------------ | -------------------------- |
| 1   | `-id`          | UUID          | Bắt buộc, duy nhất | Định danh danh mục.        |
| 2   | `-name`        | String        | Bắt buộc           | Tên danh mục đồ uống.      |
| 3   | `-description` | String [0..1] | Không bắt buộc     | Mô tả ngắn cho danh mục.   |
| 4   | `-createdAt`   | DateTime      | Bắt buộc           | Thời điểm tạo danh mục.    |
| 5   | `-updatedAt`   | DateTime      | Bắt buộc           | Thời điểm cập nhật gần nhất|

### 2.1.2. Lớp User

**Tác dụng:** Lưu thông tin tài khoản, vai trò RBAC (`CUSTOMER`, `BARISTA`, `ADMIN`) và số dư điểm thưởng hiện tại của người dùng.

> *Ghi chú đối chiếu CSDL:* Bảng `users` trong `apps/api/prisma/schema.prisma` không lưu cột `phoneNumber` (chỉ xác thực bằng `email` và `passwordHash`).

**Mô tả các thuộc tính:**

| STT | Tên thuộc tính   | Kiểu          | Ràng buộc                                   | Ý nghĩa / Ghi chú                                                                      |
| --- | ---------------- | ------------- | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | `-id`            | UUID          | Bắt buộc, duy nhất                          | Định danh người dùng.                                                                  |
| 2   | `-email`         | String        | Bắt buộc, duy nhất, đúng định dạng email    | Địa chỉ dùng để đăng nhập.                                                             |
| 3   | `-passwordHash`  | String        | Bắt buộc                                    | Mật khẩu đã được băm bằng `bcrypt`. Không trả về client hoặc ghi vào log.              |
| 4   | `-fullName`      | String [0..1] | Không bắt buộc                              | Họ tên người dùng (hiển thị trên đơn hàng và Audit Log kho của Staff).                 |
| 5   | `-role`          | Role          | Bắt buộc; mặc định `CUSTOMER`               | Vai trò phân quyền (`CUSTOMER`, `BARISTA`, `ADMIN`).                                   |
| 6   | `-loyaltyPoints` | Integer       | Bắt buộc, mặc định 0, không âm              | Số dư điểm thưởng hiện tại (10.000đ chi tiêu hợp lệ = 1 điểm).                         |
| 7   | `-createdAt`     | DateTime      | Bắt buộc                                    | Thời điểm tạo tài khoản.                                                               |
| 8   | `-updatedAt`     | DateTime      | Bắt buộc                                    | Thời điểm cập nhật tài khoản gần nhất.                                                 |

**Danh sách các method chính:**

- `+addLoyaltyPoints(points: Integer): void`: Cộng số điểm được xác định từ một đơn thanh toán thành công vào `loyaltyPoints`.
- `+createOrder(items: List<OrderDetail>, checkoutKey: String): Order`: Tạo một `Order` thuộc về `User` ở trạng thái `PENDING` với `checkoutKey` duy nhất (Idempotency-Key); backend tự tính lại `subtotal`, `discountAmount`, `totalAmount`.

### 2.1.3. Lớp Product

**Tác dụng:** Lưu thông tin món trên menu, giá theo size (`priceS`, `priceM`, `priceL`), topping được phép chọn và tồn kho khả dụng (`stock`, `version`).

**Mô tả các thuộc tính:**

| STT | Tên thuộc tính    | Kiểu          | Ràng buộc                      | Ý nghĩa / Ghi chú                                                                                                    |
| --- | ----------------- | ------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 1   | `-id`             | UUID          | Bắt buộc, duy nhất             | Định danh sản phẩm.                                                                                                  |
| 2   | `-name`           | String        | Bắt buộc                       | Tên món hiển thị trên menu.                                                                                          |
| 3   | `-description`    | String [0..1] | Không bắt buộc                 | Mô tả sản phẩm.                                                                                                      |
| 4   | `-imageUrl`       | String [0..1] | Không bắt buộc ở mức lưu trữ   | Đường dẫn ảnh hiển thị.                                                                                              |
| 5   | `-priceS`         | Decimal       | Bắt buộc, không âm             | Giá một ly size S, chưa cộng topping.                                                                                |
| 6   | `-priceM`         | Decimal       | Bắt buộc, không âm             | Giá một ly size M, chưa cộng topping.                                                                                |
| 7   | `-priceL`         | Decimal       | Bắt buộc, không âm             | Giá một ly size L, chưa cộng topping.                                                                                |
| 8   | `-toppingOptions` | JSON          | Bắt buộc, mặc định `[]`        | Danh sách topping hợp lệ dạng `[{id, name, price, isAvailable}]`.                                                    |
| 9   | `-stock`          | Integer       | Bắt buộc, mặc định 0, không âm | Số ly còn có thể bán (được đồng bộ tự động từ nguyên liệu qua `InventoryService.recalculateAllProductsStock`).        |
| 10  | `-isAvailable`    | Boolean       | Bắt buộc, mặc định true        | Trạng thái đang mở bán. Chỉ sản phẩm `isAvailable = true` và `stock > 0` mới được đặt hàng.                         |
| 11  | `-version`        | Integer       | Bắt buộc, mặc định 0           | Số phiên bản dùng cho optimistic locking khi trừ tồn kho trong transaction thanh toán (`fulfillPaidOrder`).          |
| 12  | `-createdAt`      | DateTime      | Bắt buộc                       | Thời điểm tạo sản phẩm.                                                                                              |
| 13  | `-updatedAt`      | DateTime      | Bắt buộc                       | Thời điểm cập nhật gần nhất.                                                                                         |

**Danh sách các method chính:**

- `+getPrice(size: Size, toppingIds: List<String>): Decimal`: Kiểm tra size và topping hợp lệ, trả về `giá size + Σ giá topping`.
- `+decreaseStock(quantity: Integer): void`: Giảm `stock` và tăng `version` một cách nguyên tử (optimistic locking) khi hoàn tất thanh toán.

### 2.1.4. Lớp Order

**Tác dụng:** Quản lý thông tin chung, tổng tiền, voucher áp dụng và vòng đời trạng thái của một đơn hàng.

**Mô tả các thuộc tính:**

| STT | Tên thuộc tính    | Kiểu          | Ràng buộc                               | Ý nghĩa / Ghi chú                                                                                              |
| --- | ----------------- | ------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | `-id`             | UUID          | Bắt buộc, duy nhất                      | Định danh đơn hàng.                                                                                            |
| 2   | `-orderNumber`    | Integer       | Bắt buộc, duy nhất, tự tăng             | Số thứ tự đơn (`autoincrement`), hiển thị trên UI/API dạng `#orderNumber` (`orderCode` trên response DTO).     |
| 3   | `-checkoutKey`    | String        | Bắt buộc, duy nhất                      | Khóa nhận diện yêu cầu tạo đơn (`Idempotency-Key`) để tránh tạo trùng đơn khi client gửi lại request.          |
| 4   | `-status`         | OrderStatus   | Bắt buộc, mặc định `PENDING`            | Trạng thái hiện tại trong Order State Machine.                                                                 |
| 5   | `-subtotal`       | Decimal       | Bắt buộc, không âm                      | Tổng thành tiền các dòng món trước giảm giá.                                                                   |
| 6   | `-discountAmount` | Decimal       | Bắt buộc, mặc định 0; từ 0 đến subtotal | Số tiền được giảm thực tế của đơn.                                                                             |
| 7   | `-totalAmount`    | Decimal       | Bắt buộc, không âm                      | Số tiền cuối cùng phải thanh toán (`subtotal - discountAmount`).                                               |
| 8   | `-voucherCode`    | String [0..1] | Không bắt buộc                          | Bản chụp mã voucher đã áp dụng (tối đa 1 voucher mỗi đơn).                                                     |
| 9   | `-note`           | String [0..1] | Không bắt buộc                          | Ghi chú của khách cho đơn hàng.                                                                                |
| 10  | `-createdAt`      | DateTime      | Bắt buộc                                | Thời điểm tạo đơn; làm mốc tính cửa sổ thanh toán 10 phút (`ORDER_PAYMENT_WINDOW_MS`) của đơn `PENDING`.      |
| 11  | `-updatedAt`      | DateTime      | Bắt buộc                                | Thời điểm cập nhật gần nhất.                                                                                   |

**Danh sách các method chính:**

- `+applyVoucher(voucher: Voucher, now: DateTime): void`: Kiểm tra voucher hợp lệ, lưu `voucherCode`, tính `discountAmount` và cập nhật `totalAmount`. Lượt dùng (`usedCount`) được cộng khi thanh toán thành công trong `fulfillPaidOrder`.
- `+calculateTotal(): Decimal`: Tính lại `subtotal` và `totalAmount` hoàn toàn phía Backend.
- `+changeStatus(newStatus: OrderStatus): void`: Kiểm tra chuyển trạng thái hợp lệ qua `assertOrderTransition` (`order-state-machine.ts`).

### 2.1.5. Lớp OrderDetail (model `OrderItem` trong Prisma)

**Tác dụng:** Lưu từng dòng món trong đơn hàng (`order_items`), giữ bản chụp tên món, size, topping và đơn giá tại thời điểm đặt.

| STT | Tên thuộc tính      | Kiểu    | Ràng buộc                     | Ý nghĩa / Ghi chú                                                 |
| --- | ------------------- | ------- | ----------------------------- | ----------------------------------------------------------------- |
| 1   | `-id`               | UUID    | Bắt buộc, duy nhất            | Định danh dòng món.                                               |
| 2   | `-productName`      | String  | Bắt buộc                      | Bản chụp tên sản phẩm lúc đặt.                                    |
| 3   | `-size`             | Size    | Bắt buộc                      | Size khách đã chọn (`S`, `M`, `L`).                               |
| 4   | `-quantity`         | Integer | Bắt buộc, lớn hơn hoặc bằng 1 | Số ly cùng cấu hình.                                              |
| 5   | `-selectedToppings` | JSON    | Bắt buộc, mặc định `[]`       | Bản chụp `[{id, name, price}]` các topping đã chọn trên mỗi ly.   |
| 6   | `-unitPrice`        | Decimal | Bắt buộc, không âm            | Bản chụp giá một ly đã gồm topping.                               |
| 7   | `-subtotal`         | Decimal | Bắt buộc, không âm            | Thành tiền của dòng món (`unitPrice × quantity`).                 |

### 2.1.6. Lớp Payment

**Tác dụng:** Ghi nhận thông tin và kết quả của từng lần thử thanh toán cho `Order`, hỗ trợ cả `MOCK` và `VNPAY` Sandbox (`provider`, `paymentUrl`, `expiresAt`).

| STT | Tên thuộc tính     | Kiểu            | Ràng buộc                            | Ý nghĩa / Ghi chú                                                                           |
| --- | ------------------ | --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1   | `-id`              | UUID            | Bắt buộc, duy nhất                   | Định danh giao dịch thanh toán.                                                             |
| 2   | `-attemptNumber`   | Integer         | Bắt buộc, mặc định 1; duy nhất/Order | Thứ tự lần thử thanh toán (tối đa 3 lần thử cho mỗi `Order`).                               |
| 3   | `-idempotencyKey`  | String          | Bắt buộc, duy nhất                   | Khóa idempotent (`Idempotency-Key`) chống xử lý thanh toán lặp và phát lại `paymentUrl`.    |
| 4   | `-paymentMethod`   | PaymentMethod   | Bắt buộc                             | Phương thức thanh toán (`E_WALLET`, `BANK_CARD`).                                           |
| 5   | `-provider`        | String          | Bắt buộc, mặc định `"MOCK"`          | Nhà cung cấp xử lý giao dịch: `"MOCK"` hoặc `"VNPAY"`.                                      |
| 6   | `-amount`          | Decimal         | Bắt buộc, không âm                   | Số tiền thanh toán khớp `Order.totalAmount`.                                                |
| 7   | `-status`          | PaymentStatus   | Bắt buộc, mặc định `PENDING`         | Kết quả giao dịch (`PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`).                             |
| 8   | `-transactionCode` | String [0..1]   | Không bắt buộc khi `PENDING`         | Mã giao dịch do cổng thanh toán (`MOCK` hoặc `VNPAY` `vnp_TransactionNo`) cung cấp.        |
| 9   | `-paymentUrl`      | String [0..1]   | Không bắt buộc                       | URL thanh toán VNPay đã ký HMAC-SHA512 để phát lại khi client gửi trùng `idempotencyKey`.   |
| 10  | `-expiresAt`       | DateTime [0..1] | Không bắt buộc                       | Thời điểm hết hạn của URL thanh toán (`paymentUrl`).                                        |
| 11  | `-errorCode`       | String [0..1]   | Không bắt buộc                       | Mã lỗi do cổng thanh toán trả về khi thất bại.                                              |
| 12  | `-errorMessage`    | String [0..1]   | Không bắt buộc                       | Thông báo lỗi hiển thị cho khách, không lộ thông tin nội bộ.                                |
| 13  | `-createdAt`       | DateTime        | Bắt buộc                             | Thời điểm bắt đầu giao dịch.                                                                |
| 14  | `-updatedAt`       | DateTime        | Bắt buộc                             | Thời điểm cập nhật giao dịch gần nhất.                                                      |
| 15  | `-completedAt`     | DateTime [0..1] | Không bắt buộc                       | Thời điểm hoàn tất thanh toán (`SUCCESS`/`FAILED`).                                        |
| 16  | `-refundedAt`      | DateTime [0..1] | Không bắt buộc                       | Thời điểm hoàn tiền (khi `status = REFUNDED`).                                              |

**Danh sách các Method chính:**

- `+markSucceeded(transactionCode: String, completedAt: DateTime): void`: Ghi nhận kết quả `SUCCESS` và `transactionCode`.
- `+markFailed(errorCode: String, errorMessage: String, completedAt: DateTime): void`: Ghi nhận kết quả `FAILED`, mã lỗi và thông báo lỗi.
- `+markRefunded(refundedAt: DateTime): void`: Đánh dấu giao dịch đã hoàn tiền (`REFUNDED`).

### 2.1.7. Lớp Voucher

**Tác dụng:** Lưu mã khuyến mãi (bao gồm cả mã được seed sẵn và mã sinh tự động khi khách đổi điểm Loyalty) và điều kiện áp dụng.

| STT | Tên thuộc tính   | Kiểu            | Ràng buộc                  | Ý nghĩa / Ghi chú                                                         |
| --- | ---------------- | --------------- | -------------------------- | ------------------------------------------------------------------------- |
| 1   | `-id`            | UUID            | Bắt buộc, duy nhất         | Định danh voucher.                                                        |
| 2   | `-code`          | String          | Bắt buộc, duy nhất         | Mã voucher viết hoa khách nhập khi áp dụng.                               |
| 3   | `-discountType`  | DiscountType    | Bắt buộc                   | Hình thức giảm: `FIXED_AMOUNT` hoặc `PERCENTAGE`.                         |
| 4   | `-discountValue` | Decimal         | Bắt buộc                   | Giá trị giảm (% hoặc VNĐ).                                                |
| 5   | `-minOrderValue` | Decimal [0..1]  | Không bắt buộc             | Giá trị đơn hàng tối thiểu để áp dụng voucher.                            |
| 6   | `-maxDiscount`   | Decimal [0..1]  | Không bắt buộc             | Mức giảm tối đa (áp dụng cho loại `PERCENTAGE`).                          |
| 7   | `-usageLimit`    | Integer [0..1]  | Không bắt buộc             | Tổng lượt sử dụng tối đa trên toàn hệ thống (`null` = không giới hạn).    |
| 8   | `-usedCount`     | Integer         | Bắt buộc, mặc định 0       | Tổng lượt đã ghi nhận sử dụng thành công.                                 |
| 9   | `-startDate`     | DateTime [0..1] | Không bắt buộc             | Thời điểm bắt đầu hiệu lực.                                               |
| 10  | `-endDate`       | DateTime [0..1] | Không bắt buộc             | Thời điểm hết hạn hiệu lực.                                               |
| 11  | `-isActive`      | Boolean         | Bắt buộc, mặc định true    | Cho phép hoặc tạm ngừng sử dụng voucher.                                  |
| 12  | `-createdAt`     | DateTime        | Bắt buộc                   | Thời điểm tạo voucher.                                                    |
| 13  | `-updatedAt`     | DateTime        | Bắt buộc                   | Thời điểm cập nhật gần nhất.                                              |

### 2.1.8. Lớp LoyaltyTransaction

**Tác dụng:** Ghi nhận toàn bộ lịch sử biến động điểm thưởng (`EARN` khi thanh toán đơn hàng thành công và `REDEEM` khi đổi điểm lấy voucher).

| STT | Tên thuộc tính | Kiểu            | Ràng buộc          | Ý nghĩa / Ghi chú                                                                     |
| --- | -------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------- |
| 1   | `-id`          | UUID            | Bắt buộc, duy nhất | Định danh giao dịch điểm.                                                             |
| 2   | `-points`      | Integer         | Bắt buộc           | Số điểm cộng (`EARN`) hoặc trừ (`REDEEM`).                                            |
| 3   | `-type`        | TransactionType | Bắt buộc           | Loại giao dịch điểm: `EARN` (từ đơn hàng) hoặc `REDEEM` (đổi mã giảm giá).            |
| 4   | `-createdAt`   | DateTime        | Bắt buộc           | Thời điểm phát sinh giao dịch điểm.                                                   |

### 2.1.9. Lớp Ingredient

**Tác dụng:** Lưu danh mục nguyên liệu pha chế trong kho (ví dụ: Cà phê hạt, Sữa tươi, Trân châu...) và ngưỡng cảnh báo tồn kho thấp.

| STT | Tên thuộc tính  | Kiểu     | Ràng buộc               | Ý nghĩa / Ghi chú                                         |
| --- | --------------- | -------- | ----------------------- | --------------------------------------------------------- |
| 1   | `-id`           | UUID     | Bắt buộc, duy nhất      | Định danh nguyên liệu.                                    |
| 2   | `-name`         | String   | Bắt buộc, duy nhất      | Tên nguyên liệu trong kho.                                |
| 3   | `-unit`         | String   | Bắt buộc                | Đơn vị đo lường (`"g"`, `"ml"`, `"cái"`...).              |
| 4   | `-stock`        | Decimal  | Bắt buộc, mặc định 0    | Số lượng nguyên liệu hiện còn trong kho.                  |
| 5   | `-minThreshold` | Decimal  | Bắt buộc, mặc định 100  | Ngưỡng cảnh báo sắp hết hàng hiển thị tại Staff Portal.   |
| 6   | `-createdAt`    | DateTime | Bắt buộc                | Thời điểm tạo nguyên liệu.                                |
| 7   | `-updatedAt`    | DateTime | Bắt buộc                | Thời điểm cập nhật gần nhất.                              |

### 2.1.10. Lớp RecipeItem

**Tác dụng:** Bảng định mức công thức nối giữa `Product` và `Ingredient` theo từng kích cỡ (`S`, `M`, `L`), phục vụ tự động trừ nguyên liệu và tính số ly khả dụng (`Product.stock`).

| STT | Tên thuộc tính | Kiểu     | Ràng buộc                                       | Ý nghĩa / Ghi chú                                   |
| --- | -------------- | -------- | ----------------------------------------------- | --------------------------------------------------- |
| 1   | `-id`          | UUID     | Bắt buộc, duy nhất                              | Định danh dòng công thức.                           |
| 2   | `-size`        | Size     | Bắt buộc; duy nhất theo `(productId, ingredientId, size)` | Kích cỡ áp dụng (`S`, `M`, `L`).          |
| 3   | `-amount`      | Decimal  | Bắt buộc                                        | Định lượng nguyên liệu tiêu hao cho 1 ly kích cỡ này.|
| 4   | `-createdAt`   | DateTime | Bắt buộc                                        | Thời điểm tạo công thức.                            |
| 5   | `-updatedAt`   | DateTime | Bắt buộc                                        | Thời điểm cập nhật công thức gần nhất.              |

### 2.1.11. Lớp RefundRequest

**Tác dụng:** Lưu yêu cầu hủy đơn và hoàn tiền khi khách hàng yêu cầu hủy một đơn hàng đã thanh toán (`Order.status = PAID`), chờ `BARISTA`/`ADMIN` phê duyệt tại Staff Portal.

| STT | Tên thuộc tính | Kiểu                | Ràng buộc                    | Ý nghĩa / Ghi chú                                                      |
| --- | -------------- | ------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| 1   | `-id`          | UUID                | Bắt buộc, duy nhất           | Định danh yêu cầu hoàn tiền.                                           |
| 2   | `-amount`      | Decimal             | Bắt buộc                     | Số tiền yêu cầu hoàn (bằng `Order.totalAmount`).                       |
| 3   | `-reason`      | String [0..1]       | Không bắt buộc               | Lý do hủy/hoàn tiền của khách hàng.                                    |
| 4   | `-status`      | RefundRequestStatus | Bắt buộc, mặc định `PENDING` | Trạng thái duyệt hoàn tiền (`PENDING`, `APPROVED`, `REJECTED`).        |
| 5   | `-processedBy` | String [0..1]       | Không bắt buộc               | Email nhân viên `BARISTA`/`ADMIN` đã xử lý duyệt yêu cầu.              |
| 6   | `-processedAt` | DateTime [0..1]     | Không bắt buộc               | Thời điểm duyệt xử lý hoàn tiền.                                       |
| 7   | `-createdAt`   | DateTime            | Bắt buộc                     | Thời điểm tạo yêu cầu.                                                 |
| 8   | `-updatedAt`   | DateTime            | Bắt buộc                     | Thời điểm cập nhật gần nhất.                                           |

### 2.1.12. Lớp IngredientAuditLog

**Tác dụng:** Nhật ký kiểm toán ghi nhận mọi biến động tồn kho nguyên liệu (`CREATE`, `RESTOCK`, `UPDATE`, `DELETE`, `ORDER_DEDUCT`) để đồng bộ theo dõi giữa các nhân viên quầy và Admin.

| STT | Tên thuộc tính    | Kiểu                | Ràng buộc          | Ý nghĩa / Ghi chú                                                    |
| --- | ----------------- | ------------------- | ------------------ | -------------------------------------------------------------------- |
| 1   | `-id`             | UUID                | Bắt buộc, duy nhất | Định danh dòng log kho.                                              |
| 2   | `-ingredientId`   | String [0..1]       | Không bắt buộc     | Snapshot ID nguyên liệu (giữ nguyên ngay cả khi nguyên liệu bị xóa). |
| 3   | `-ingredientName` | String              | Bắt buộc           | Bản chụp tên nguyên liệu tại thời điểm thao tác.                     |
| 4   | `-action`         | IngredientLogAction | Bắt buộc           | Hành động biến động kho (`CREATE`, `RESTOCK`, `UPDATE`, `DELETE`, `ORDER_DEDUCT`). |
| 5   | `-changeAmount`   | Decimal [0..1]      | Không bắt buộc     | Lượng thay đổi tăng/giảm.                                            |
| 6   | `-previousStock`  | Decimal [0..1]      | Không bắt buộc     | Tồn kho trước khi thay đổi.                                          |
| 7   | `-newStock`       | Decimal [0..1]      | Không bắt buộc     | Tồn kho sau khi thay đổi.                                            |
| 8   | `-unit`           | String              | Bắt buộc           | Đơn vị đo lường tại thời điểm ghi log.                               |
| 9   | `-reason`         | String [0..1]       | Không bắt buộc     | Lý do hoặc mã đơn hàng phát sinh biến động.                          |
| 10  | `-performedBy`    | String [0..1]       | Không bắt buộc     | Tên nhân viên (`fullName`/`email`) hoặc hệ thống thực hiện thao tác. |
| 11  | `-createdAt`      | DateTime            | Bắt buộc           | Thời điểm phát sinh log.                                             |

## 3. Các Enum

| Enum                  | Giá trị                                                                 | Ý nghĩa                                                                                                     |
| --------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Role`                | `CUSTOMER`, `BARISTA`, `ADMIN`                                          | Vai trò phân quyền RBAC: Khách hàng (`CUSTOMER`), Nhân viên pha chế (`BARISTA`) và Quản trị viên (`ADMIN`). |
| `Size`                | `S`, `M`, `L`                                                           | Kích thước đồ uống và công thức định lượng (`RecipeItem`).                                                  |
| `OrderStatus`         | `PENDING`, `PAID`, `PREPARING`, `READY`, `COMPLETED`, `PAYMENT_FAILED`, `CANCELLED` | Trạng thái vòng đời đơn hàng theo Order State Machine (`order-state-machine.ts`).                         |
| `PaymentMethod`       | `E_WALLET`, `BANK_CARD`                                                 | Phương thức thanh toán không dùng tiền mặt.                                                                 |
| `PaymentStatus`       | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`                              | Trạng thái của một lần thử thanh toán; `REFUNDED` khi giao dịch đã được đánh dấu hoàn tiền.                 |
| `DiscountType`        | `FIXED_AMOUNT`, `PERCENTAGE`                                            | Hình thức tính giảm giá cho `Voucher`.                                                                      |
| `TransactionType`     | `EARN`, `REDEEM`                                                        | Loại giao dịch điểm thưởng Loyalty (`EARN`: tích điểm từ đơn hàng; `REDEEM`: đổi điểm lấy voucher).        |
| `RefundRequestStatus` | `PENDING`, `APPROVED`, `REJECTED`                                       | Trạng thái xử lý yêu cầu hủy đơn/hoàn tiền tại Staff Portal.                                                |
| `IngredientLogAction` | `CREATE`, `RESTOCK`, `UPDATE`, `DELETE`, `ORDER_DEDUCT`                 | Loại thao tác biến động kho nguyên liệu được lưu trong `IngredientAuditLog`.                                |
