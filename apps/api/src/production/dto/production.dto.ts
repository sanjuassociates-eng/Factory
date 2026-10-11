import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductionDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  tonnage!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
