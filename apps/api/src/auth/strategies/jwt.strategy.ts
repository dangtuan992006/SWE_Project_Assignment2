// backend/src/auth/strategies/jwt.strategy.ts
import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { getJwtSecret } from '../jwt-secret';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Optional() @Inject(PrismaService) private readonly prisma?: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    if (this.prisma?.user?.findUnique) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true },
      });
      if (!user) {
        throw new UnauthorizedException('Tài khoản không còn tồn tại hoặc token đã bị thu hồi');
      }
      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }

    // Fallback cho unit test không khởi tạo PrismaService
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role || 'CUSTOMER',
    };
  }
}