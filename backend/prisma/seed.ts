import { PrismaClient, VoucherType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu nạp dữ liệu Voucher...');

  // Sử dụng upsert để đảm bảo chạy lại lệnh seed nhiều lần không bị lỗi trùng lặp khóa chính
  const voucher1 = await prisma.voucher.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountType: VoucherType.PERCENTAGE,
      discountValue: 10,
      isActive: true,
    },
  });

  const voucher2 = await prisma.voucher.upsert({
    where: { code: 'BREW20K' },
    update: {},
    create: {
      code: 'BREW20K',
      discountType: VoucherType.FIXED_AMOUNT,
      discountValue: 20000,
      isActive: true,
    },
  });

  const voucher3 = await prisma.voucher.upsert({
    where: { code: 'FREESHIP' },
    update: {},
    create: {
      code: 'FREESHIP',
      discountType: VoucherType.FIXED_AMOUNT,
      discountValue: 15000,
      isActive: true,
    },
  });

  console.log('Đã nạp thành công các mã Voucher:');
  console.log([voucher1.code, voucher2.code, voucher3.code]);
}

main()
  .catch((e) => {
    console.error('Lỗi khi nạp dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
