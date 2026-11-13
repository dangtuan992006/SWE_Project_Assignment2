import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RefundsService } from './refunds.service';
@Module({
  imports: [PrismaModule],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}
