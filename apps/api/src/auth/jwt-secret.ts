const DEV_FALLBACK_JWT_SECRET = 'brewlite_dev_secret_key';

/** Lấy khóa ký/xác minh JWT; môi trường production bắt buộc phải cấu hình JWT_SECRET. */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET bắt buộc phải cấu hình trong môi trường production.');
  }

  return DEV_FALLBACK_JWT_SECRET;
}
