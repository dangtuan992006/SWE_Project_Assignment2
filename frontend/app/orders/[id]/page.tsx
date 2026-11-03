import Link from 'next/link';

type OrderConfirmationPageProps = {
  params: Promise<{ id: string }>;
};

export const instant = false;

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps) {
  const { id: orderId } = await params;

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-emerald-600 bg-emerald-500 text-5xl font-black text-white shadow-lg shadow-emerald-200">
        ✓
      </div>
      <h1 className="mt-4 text-2xl font-black text-slate-900">
        Đặt đơn thành công
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Đơn hàng của bạn đã được tạo và đang chờ xử lý thanh toán.
      </p>
      <p className="mt-3 rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-600 shadow-sm">
        Mã đơn: {orderId}
      </p>
      <Link
        href="/orders"
        className="mt-6 rounded-lg bg-amber-800 px-5 py-3 text-sm font-bold text-white hover:bg-amber-900"
      >
        Xem lịch sử đơn hàng
      </Link>
    </section>
  );
}
