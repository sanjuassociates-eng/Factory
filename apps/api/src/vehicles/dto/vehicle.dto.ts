import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VehicleItemDto {
  @IsString()
  productId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  tonnage!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerUnit!: number;
}

export class CreateVehicleDto {
  @IsString()
  buyerId!: string;

  @IsString()
  vehicleNumber!: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  driverPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleItemDto)
  items!: VehicleItemDto[];
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  buyerId?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  driverPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleItemDto)
  items?: VehicleItemDto[];
}
