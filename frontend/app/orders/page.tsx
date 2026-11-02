
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient } from '@/utils/apiClient';
import type { ApiResponse, Order, OrderStatus } from '@/types/brewlite';

const MOCK_ORDERS: Order[] = [
  {
    id: 'mock-order-1042',
    orderCode: '#1042',
    userId: 'mock-user',
    status: 'PAID',
    subtotal: 89000,
    discountAmount: 0,
    totalAmount: 89000,
    items: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-order-1041',
    orderCode: '#1041',
    userId: 'mock-user',
    status: 'READY',
    subtotal: 65000,
    discountAmount: 5000,
    totalAmount: 60000,
    items: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  PREPARING: 'Đang pha chế',
  READY: 'Sẵn sàng nhận nước',
  COMPLETED: 'Đã hoàn thành',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  CANCELLED: 'Đã hủy',
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ thời gian';

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      setError('');

      try {
        const response = await apiClient.get<ApiResponse<Order[]>>(
          '/orders/me',
        );

        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'Dữ liệu đơn hàng không hợp lệ.');
        }

        if (active) {
          setOrders(response.data);
        }
      } catch {
        // Backend chưa triển khai: sử dụng mock để phát triển UI.
        if (active) {
          setOrders(MOCK_ORDERS);
          setError(
            'Không kết nối được API. Đang hiển thị dữ liệu mẫu.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-5 px-4 py-6 pb-24">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Trang chủ
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Lịch sử đơn hàng
        </h1>
        <p className="text-sm text-gray-500">
          Theo dõi các đơn hàng BrewLite của bạn.
        </p>
      </header>

      {error && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-label="Đang tải đơn hàng">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse space-y-3 rounded-2xl border border-gray-200 p-4"
            >
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-48 rounded bg-gray-100" />
              <div className="h-5 w-28 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 px-5 py-12 text-center">
          <div className="text-4xl" aria-hidden="true">☕</div>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Bạn chưa có đơn hàng
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Hãy chọn món yêu thích và đặt đơn đầu tiên nhé.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-xl bg-amber-700 px-5 py-3 font-medium text-white hover:bg-amber-800"
          >
            Khám phá menu
          </Link>
        </section>
      ) : (
        <section className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${encodeURIComponent(order.id)}`}
              className="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-amber-400 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900">
                    Đơn hàng {order.orderCode}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  {STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-sm text-gray-500">
                  {order.items?.length ?? 0} loại món
                </span>
                <span className="font-bold text-gray-900">
                  {formatMoney(order.totalAmount)}
                </span>
              </div>

              <p className="mt-3 text-right text-sm font-medium text-amber-800">
                Xem chi tiết →
              </p>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
