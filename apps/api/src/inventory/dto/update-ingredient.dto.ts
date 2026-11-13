import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIngredientDto {
  @ApiPropertyOptional({ description: 'Tên nguyên liệu', example: 'Hạt cà phê Arabica Cầu Đất' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Đơn vị tính', example: 'g' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional({ description: 'Số lượng tồn kho', example: 4500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Ngưỡng cảnh báo sắp hết', example: 300 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minThreshold?: number;

  @ApiPropertyOptional({ description: 'Lý do cập nhật', example: 'Điều chỉnh kiểm kê định kỳ' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
