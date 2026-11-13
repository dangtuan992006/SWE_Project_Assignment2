const ALLOWED_PRODUCT_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/** Chỉ cho phép đường dẫn tương đối nội bộ để chống Open Redirect. */
export function sanitizeRedirectPath(
  raw: string | null | undefined,
  fallback = "/UserProfile",
): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed || trimmed === "/") {
    return fallback;
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  try {
    const resolved = new URL(trimmed, "https://brewlite.local");
    if (resolved.origin !== "https://brewlite.local") {
      return fallback;
    }
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === "BARISTA" || role === "ADMIN";
}

export function isAllowedProductImageType(mimeType: string | null | undefined): boolean {
  return ALLOWED_PRODUCT_IMAGE_TYPES.has((mimeType ?? "").trim().toLowerCase());
}
