"use client";

/**
 * ============================================================================
 * USER PROFILE PAGE (/UserProfile)
 * ============================================================================
 *
 * Tuyến đường hiển thị thông tin tài khoản người dùng sau khi đã đăng nhập:
 * - Bảo vệ route: Nếu chưa đăng nhập -> chuyển hướng về /login?redirect=/UserProfile
 * - Hiển thị thông tin hồ sơ và điểm thưởng qua component UserProfile
 * - Hỗ trợ đăng xuất tài khoản
 */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserProfile, { UserInfo } from "@/components/UserProfile";
import { authStorage } from "@/utils/authStorage";
import { apiClient } from "@/utils/apiClient";

export default function UserProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authStorage.getToken();
    const storedUser = authStorage.getUser() as UserInfo | null;

    if (!token || !storedUser) {
      router.replace("/login?redirect=/UserProfile");
      return;
    }

    setUser(storedUser);
    setLoading(false);

    // Đồng bộ thông tin mới nhất từ máy chủ (điểm tích lũy mới nhất)
    apiClient
      .get<{ user?: UserInfo } | UserInfo>("/auth/me")
      .then((data) => {
        const freshUser = (
          data && "user" in data ? data.user : data
        ) as UserInfo;
        if (freshUser && freshUser.email) {
          setUser(freshUser);
          authStorage.setSession(token, freshUser);
        }
      })
      .catch(() => {
        // Nếu lỗi kết nối vẫn giữ thông tin đã lưu trong localStorage
      });
  }, [router]);

  const handleLogout = () => {
    authStorage.clearSession();
    router.replace("/login");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4 text-sm text-stone-500">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
          <span>Đang tải thông tin tài khoản...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="px-1">
      <UserProfile user={user} onLogout={handleLogout} />
    </main>
  );
}
