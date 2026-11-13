import { Transform } from 'class-transformer';
import { IsIn, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RejectRefundDto {
  @ApiProperty({ minLength: 5, maxLength: 500 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(5, 500)
  reason!: string;
}
export class ResolveRefundDto {
  @ApiProperty({ enum: ['SUCCEEDED', 'FAILED'] })
  @IsIn(['SUCCEEDED', 'FAILED'])
  status!: 'SUCCEEDED' | 'FAILED';
  @ApiProperty({
    minLength: 12,
    maxLength: 1000,
    description:
      'Mã/chứng từ kết quả đối soát với VNPay. Không ghi OTP hoặc thông tin thẻ.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(12, 1000)
  evidence!: string;
}
