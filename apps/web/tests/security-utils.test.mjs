import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

function loadSecurityUtils() {
  const source = fs.readFileSync(path.join(testDirectory, '../utils/security.ts'), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, URL });
  return exports;
}

test('sanitizeRedirectPath chặn Open Redirect và giữ đường dẫn nội bộ hợp lệ (F-06)', () => {
  const { sanitizeRedirectPath } = loadSecurityUtils();

  assert.equal(sanitizeRedirectPath('/orders/123'), '/orders/123');
  assert.equal(sanitizeRedirectPath('/cart?tab=vnpay'), '/cart?tab=vnpay');
  assert.equal(sanitizeRedirectPath('/'), '/UserProfile');
  assert.equal(sanitizeRedirectPath(''), '/UserProfile');
  assert.equal(sanitizeRedirectPath(null), '/UserProfile');

  for (const evil of [
    'https://evil.example/phish',
    'http://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    'https://brewlite.vn@evil.example',
  ]) {
    assert.equal(sanitizeRedirectPath(evil), '/UserProfile');
  }
});

test('isStaffRole cho phép cả BARISTA và ADMIN, từ chối CUSTOMER/undefined (F-10)', () => {
  const { isStaffRole } = loadSecurityUtils();
  assert.equal(isStaffRole('BARISTA'), true);
  assert.equal(isStaffRole('ADMIN'), true);
  assert.equal(isStaffRole('CUSTOMER'), false);
  assert.equal(isStaffRole(undefined), false);
});

test('isAllowedProductImageType chỉ cho ảnh raster an toàn, chặn SVG (F-07)', () => {
  const { isAllowedProductImageType } = loadSecurityUtils();
  assert.equal(isAllowedProductImageType('image/png'), true);
  assert.equal(isAllowedProductImageType('image/jpeg'), true);
  assert.equal(isAllowedProductImageType('image/webp'), true);
  assert.equal(isAllowedProductImageType('image/svg+xml'), false);
  assert.equal(isAllowedProductImageType('text/html'), false);
});
