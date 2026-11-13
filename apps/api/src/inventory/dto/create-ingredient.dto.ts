import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIngredientDto {
  @ApiProperty({ description: 'Tên nguyên liệu', example: 'Hạt cà phê Robusta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ description: 'Đơn vị tính', example: 'g' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  unit: string;

  @ApiProperty({ description: 'Số lượng ban đầu', example: 5000 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ description: 'Ngưỡng cảnh báo sắp hết', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minThreshold?: number;
}
