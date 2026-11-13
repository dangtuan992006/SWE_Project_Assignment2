import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './strategies/jwt.strategy';

describe('JwtStrategy Security Boundaries (F-01)', () => {
  const origNodeEnv = process.env.NODE_ENV;
  const origJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (origNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = origNodeEnv;
    }
    if (origJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = origJwtSecret;
    }
  });

  it('từ chối khởi tạo khi NODE_ENV=production mà thiếu JWT_SECRET (chống dùng fallback literal)', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    expect(() => new JwtStrategy()).toThrow(/JWT_SECRET/);
  });

  it('từ chối token nếu user đã bị xóa khỏi CSDL (revocation check) và dùng role mới nhất từ DB', async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'unit-test-secret';

    const mockPrisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'user-1',
            email: 'staff@brewlite.vn',
            role: 'CUSTOMER',
          }),
      },
    };

    const StrategyCtor = JwtStrategy as unknown as new (prisma?: unknown) => JwtStrategy;
    const strategy = new StrategyCtor(mockPrisma);

    await expect(
      strategy.validate({ sub: 'deleted-user', email: 'ghost@brewlite.vn', role: 'ADMIN' }),
    ).rejects.toThrow(UnauthorizedException);

    const validated = await strategy.validate({
      sub: 'user-1',
      email: 'staff@brewlite.vn',
      role: 'BARISTA',
    });
    expect(validated.role).toBe('CUSTOMER');
  });
});
