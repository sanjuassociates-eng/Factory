import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permission } from '@steel-factory/shared';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Controller('products')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.productsService.findAll(activeOnly === 'true');
  }

  @Post()
  @RequirePermissions(Permission.MANAGE_PRODUCTS)
  @UseInterceptors(AuditInterceptor)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.MANAGE_PRODUCTS)
  @UseInterceptors(AuditInterceptor)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_PRODUCTS)
  @UseInterceptors(AuditInterceptor)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
