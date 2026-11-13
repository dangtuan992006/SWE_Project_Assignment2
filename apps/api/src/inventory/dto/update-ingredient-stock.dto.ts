import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StockAction {
  ADD = 'ADD',
  SET = 'SET',
}

export class UpdateIngredientStockDto {
  @ApiProperty({
    description: 'Số lượng cần điều chỉnh (không âm)',
    example: 1000,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Hành động: ADD (cộng dồn) hoặc SET (ghi đè giá trị mới)',
    enum: StockAction,
    default: StockAction.ADD,
  })
  @IsOptional()
  @IsEnum(StockAction)
  action?: StockAction = StockAction.ADD;
}
