import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiPropertyOptional({
    description: 'Lý do khách hàng hủy đơn',
    example: 'Tôi đặt nhầm món, muốn đổi lại',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
