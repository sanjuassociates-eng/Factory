import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateBuyerDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateBuyerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
