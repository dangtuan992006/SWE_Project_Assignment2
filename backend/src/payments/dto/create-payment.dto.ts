import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('all')
  orderId!: string;

  @ApiProperty({ enum: ['E_WALLET', 'BANK_CARD'] })
  @IsIn(['E_WALLET', 'BANK_CARD'])
  paymentMethod!: 'E_WALLET' | 'BANK_CARD';
}
