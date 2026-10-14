import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { StockAdjustmentType } from '@prisma/client';

export class CreateAdjustmentDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsNumber()
  tonnage!: number; // negative = reduction, positive = addition

  @IsEnum(StockAdjustmentType)
  type!: StockAdjustmentType;

  @IsString()
  reason!: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
