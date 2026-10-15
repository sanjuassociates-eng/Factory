import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VehicleStatus } from '@prisma/client';
import { Permission } from '@steel-factory/shared';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@RequirePermissions(Permission.DISPATCH_VEHICLES)
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}

  @Get()
  findAll(
    @Query('status') status?: VehicleStatus,
    @Query('buyerId') buyerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.vehiclesService.findAll({ status, buyerId, from, to });
  }

  @Get('revenue/today')
  @RequirePermissions(Permission.VIEW_REVENUE)
  getTodayRevenue() {
    return this.vehiclesService.getTodayRevenue().then((total) => ({ total }));
  }

  @Get('revenue/daily')
  @RequirePermissions(Permission.VIEW_REVENUE)
  getRevenueByDay(@Query('from') from?: string, @Query('to') to?: string) {
    return this.vehiclesService.getRevenueByDay(from, to);
  }

  @Post()
  @UseInterceptors(AuditInterceptor)
  create(@Body() dto: CreateVehicleDto, @Req() req: { user: { id: string } }) {
    return this.vehiclesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseInterceptors(AuditInterceptor)
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Patch(':id/pickup')
  @UseInterceptors(AuditInterceptor)
  markPickup(@Param('id') id: string) {
    return this.vehiclesService.markPickup(id);
  }

  @Delete(':id')
  @UseInterceptors(AuditInterceptor)
  cancel(@Param('id') id: string) {
    return this.vehiclesService.cancel(id);
  }

  @Delete(':id/permanent')
  @UseInterceptors(AuditInterceptor)
  hardDelete(@Param('id') id: string) {
    return this.vehiclesService.hardDelete(id);
  }
}
