import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
const nativeRequire = createRequire(import.meta.url);
function load(name, imports = {}) {
  const source = fs.readFileSync(
    new URL(`../components/${name}.tsx`, import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (id) => imports[id] ?? nativeRequire(id),
  });
  return exports.default;
}
const Status = load("RefundStatus");
const Actions = load("RefundStaffActions", {
  "./RefundStatus": { default: Status },
  "@/utils/apiClient": { apiClient: {} },
});
const fixture = (status) => ({
  id: "r1",
  status,
  amount: "90000.00",
  provider: "VNPAY",
  refundMethod: "POINTS",
  refundPoints: 90,
  vndPerPoint: 1000,
  reason: "Đặt nhầm món",
});
const render = (refund) =>
  renderToStaticMarkup(createElement(Status, { refund }));
test("thành công hiển thị điểm được hoàn, không tuyên bố hoàn qua ngân hàng", () => {
  const html = render(fixture("SUCCEEDED"));
  assert.match(html, /Đã hoàn điểm/);
  assert.match(html, /90.*điểm/);
  assert.match(html, /Không hoàn qua VNPay\/ngân hàng/);
  assert.doesNotMatch(html, /Đã hoàn tiền/);
});
test("chờ duyệt hiển thị dự kiến và tỷ lệ, không tuyên bố đã cộng", () => {
  const html = render(fixture("PENDING"));
  assert.match(html, /Điểm dự kiến hoàn/);
  assert.match(html, /làm tròn lên/);
  assert.doesNotMatch(html, /Đã hoàn điểm/);
});
test("phân biệt điểm hoàn với Mock thanh toán gốc", () => {
  assert.doesNotMatch(
    render({ ...fixture("SUCCEEDED"), provider: "MOCK" }),
    /Hoàn tiền giả lập/,
  );
});
test("bảo toàn lịch sử CASH thành công, không gắn nhãn hoàn điểm", () => {
  const html = render({
    ...fixture("SUCCEEDED"),
    refundMethod: "CASH",
    refundPoints: null,
  });
  assert.match(html, /Đã hoàn tiền/);
  assert.doesNotMatch(html, /Điểm đã hoàn/);
});
for (const status of ["PROCESSING", "UNKNOWN", "APPROVED"])
  test(`chặn cộng trùng cho lượt cũ ${status}`, () => {
    const refund = { ...fixture(status), refundMethod: "CASH" };
    assert.match(render(refund), /Cần đối soát lượt cũ/);
    const html = renderToStaticMarkup(
      createElement(Actions, {
        orderId: "o1",
        refund,
        onChanged: async () => {},
      }),
    );
    assert.doesNotMatch(html, /Duyệt và hoàn điểm|Hoàn bằng điểm/);
  });
for (const status of ["PENDING", "FAILED", "SUCCEEDED", "REJECTED"])
  test(`nút thao tác đúng với ${status}`, () => {
    const html = renderToStaticMarkup(
      createElement(Actions, {
        orderId: "o1",
        refund: fixture(status),
        onChanged: async () => {},
      }),
    );
    assert.equal(
      /Duyệt và hoàn điểm|Hoàn bằng điểm/.test(html),
      ["PENDING", "FAILED"].includes(status),
    );
    assert.equal(html.includes("Từ chối yêu cầu"), status === "PENDING");
    assert.doesNotMatch(html, /Ghi nhận kết quả đối soát/);
  });
