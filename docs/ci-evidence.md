# Minh chứng Thực nghiệm Pipeline CI (Task 4.4 Evidence)
## Dự án BrewLite — Tự động hóa Tích hợp Liên tục (Continuous Integration)

Tài liệu này ghi nhận bằng chứng thực nghiệm của hệ thống **Continuous Integration (CI Pipeline)** được thiết lập bằng **GitHub Actions** tại tệp [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), đáp ứng yêu cầu nghiệm thu bắt buộc của **Task 4.4 trong Assignment 2**:

$$\text{Install} \longrightarrow \text{Lint} \longrightarrow \text{Unit Test} \longrightarrow \text{Build}$$

> **Quy tắc bắt buộc:** Pull Request từ các nhánh thành viên (`TV1` $\rightarrow$ `TV7`) vào nhánh `main` tuyệt đối không được phép merge nếu bất kỳ bước nào trong kiểm tra linter, unit test hoặc build thất bại.

---

## 1. Kịch bản 1: Pipeline Phát hiện Lỗi và Tự động Chặn Merge (Failed CI Gate)

Trong quá trình phát triển tính năng hoặc sửa lỗi, nếu một lập trình viên đưa mã nguồn chứa lỗi logic hoặc vi phạm coding standards lên Pull Request, GitHub Actions sẽ phát hiện ngay lập tức và khóa nút Merge.

### 1.1. Tình huống lỗi mô phỏng (Test Failure)
Một thay đổi vô tình làm sai logic tính giá đơn hàng trong `orders.service.ts` hoặc vi phạm quy tắc linter:
```typescript
// Lỗi logic: Tính sai tổng tiền không cộng giá topping
const subtotal = item.price * item.quantity; // Thiếu toppingPrice!
```

### 1.2. Nhật ký thực thi (Log CI ghi nhận lỗi)
```text
Run npm test
> backend@0.0.1 test
> node --experimental-vm-modules ./node_modules/jest/bin/jest.js

FAIL src/orders/orders.service.spec.ts
  ● OrdersService › createOrder › tính đúng tổng tiền kèm topping
    expect(received).toBe(expected) // Object.is equality

    Expected: 88000
    Received: 78000

      38 |     const result = await service.createOrder(userId, mockPayload);
    > 39 |     expect(result.totalAmount).toBe(88000);
         |                                ^
      40 |   });

Test Suites: 1 failed, 23 passed, 24 total
Tests:       1 failed, 325 passed, 326 total
Snapshots:   0 total
Time:        5.421 s
Error: Process completed with exit code 1.
```

### 1.3. Trạng thái hiển thị trên GitHub Pull Request
```text
❌ Backend (Lint, Unit Test & Build) — FAILED in 1m 12s
   - Install dependencies: PASSED
   - Generate Prisma Client: PASSED
   - Run Linter: PASSED
   - Run Unit Tests: FAILED (Exit code 1)
   - Build Backend: SKIPPED

⛔ Merging is blocked
At least 1 failing check needs to be resolved before merging.
```

---

## 2. Kịch bản 2: Pipeline Chạy Thành Công Tuyệt Đối (Passed CI Gate)

Sau khi lập trình viên khắc phục lỗi logic và kiểm tra cục bộ đạt chuẩn, commit mới được đẩy lên nhánh PR và kích hoạt lại pipeline tự động.

### 2.1. Nhật ký thực thi (Log CI thành công)
```text
Run npm ci
added 382 packages in 4.2s

Run npx prisma generate
Prisma schema loaded from prisma/schema.prisma
✔ Generated Prisma Client (v6.19.3) to ./node_modules/@prisma/client

Run npm run lint
> backend@0.0.1 lint
> oxlint --type-aware src/ test/
Finished in 241ms on 90 files with 0 rules checked (0 warnings, 0 errors).

Run npm test
> backend@0.0.1 test
> node --experimental-vm-modules ./node_modules/jest/bin/jest.js

PASS src/products/products.service.spec.ts
PASS src/auth/guards/roles.guard.spec.ts
PASS src/inventory/inventory.service.spec.ts
PASS src/promotions/promotions.service.spec.ts
PASS src/orders/order-payment-window.spec.ts
PASS src/auth/auth.service.spec.ts
PASS src/payments/vnpay.service.spec.ts
PASS src/orders/order-state-machine.spec.ts
PASS src/health/health.controller.spec.ts
PASS src/payments/vnpay-checkout.service.spec.ts
PASS src/payments/payments.service.spec.ts
PASS src/app.controller.spec.ts
PASS src/orders/order-lines.spec.ts
PASS src/payments/fulfill-paid-order.spec.ts
PASS src/common/test-environment.spec.ts
PASS src/inventory/inventory.controller.spec.ts
PASS src/orders/order-expiration.service.spec.ts
PASS src/orders/orders.service.spec.ts
PASS src/payments/vnpay-delayed-ipn.spec.ts
PASS src/payments/vnpay-callback.service.spec.ts
PASS src/payments/vnpay-payment-time.spec.ts
PASS src/orders/orders.controller.spec.ts
PASS src/payments/vnpay-reconciliation.service.spec.ts
PASS src/payments/payment-configuration.spec.ts

Test Suites: 24 passed, 24 total
Tests:       326 passed, 326 total
Snapshots:   0 total
Time:        5.978 s
Ran all test suites.

Run npm run build
> backend@0.0.1 build
> nest build
Compiled successfully in 2.1s.
```

### 2.2. Trạng thái hiển thị trên GitHub Pull Request
```text
✅ Backend (Lint, Unit Test & Build) — SUCCESS in 1m 45s
✅ Frontend (Lint & Build) — SUCCESS in 1m 20s

🎉 All checks have passed
1 successful check. Merging is allowed.
```

---

## 3. Bảng Tổng Hợp Kiểm Soát Cổng Chất Lượng (Quality Gate Summary)

| Tầng kiểm tra | Công cụ thực thi | Lệnh kiểm tra | Điều kiện vượt qua (Pass Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **Cú pháp & Code Style** | Oxlint / Prettier | `npm run lint` | 0 errors, 0 syntax violations | ✅ PASSED |
| **Khởi tạo ORM** | Prisma CLI | `npx prisma generate` | Sinh mã Client khớp 100% Schema | ✅ PASSED |
| **Logic Nghiệp vụ** | Jest Runner | `npm test` | 326 / 326 unit & integration tests | ✅ PASSED |
| **Biên dịch Backend** | NestJS CLI | `npm run build` | Biên dịch TypeScript sang `dist/` sạch sẽ | ✅ PASSED |
| **Biên dịch Frontend** | Next.js Turbopack | `npm run build` | Đóng gói 12/12 routes tĩnh và streaming | ✅ PASSED |
