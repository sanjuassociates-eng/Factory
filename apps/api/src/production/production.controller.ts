import { Body, Controller, Get, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permission } from '@steel-factory/shared';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { ProductionService } from './production.service';
import { CreateProductionDto } from './dto/production.dto';

@Controller('production')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequirePermissions(Permission.LOG_PRODUCTION)
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
  ) {
    return this.productionService.findAll({ from, to, productId });
  }

  @Post()
  @UseInterceptors(AuditInterceptor)
  create(@Body() dto: CreateProductionDto, @Req() req: { user: { id: string } }) {
    return this.productionService.create(dto, req.user.id);
  }
}
