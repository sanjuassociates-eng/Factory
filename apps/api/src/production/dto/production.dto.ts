import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductionDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  tonnage!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerUnit?: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProductionDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  tonnage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerUnit?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
