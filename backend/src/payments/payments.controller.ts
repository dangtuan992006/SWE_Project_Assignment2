import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Xử lý thanh toán mock có chống gửi trùng' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  async process(
    @CurrentUser() user: { id: string },
    @Headers('idempotency-key') rawKey: string | undefined,
    @Body() dto: CreatePaymentDto,
  ) {
    const key = rawKey?.trim() || randomUUID();
    if (key.length > 128) {
      throw new BadRequestException('Idempotency-Key tối đa 128 ký tự.');
    }
    return this.paymentsService.process(user.id, key, dto);
  }
}
