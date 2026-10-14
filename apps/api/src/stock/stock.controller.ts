import { Body, Controller, Get, Post, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Permission } from '@steel-factory/shared';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { StockService } from './stock.service';
import { CreateAdjustmentDto } from './dto/adjustment.dto';

@Controller('stock')
@UseGuards(AuthGuard('jwt'))
export class StockController {
  constructor(private stockService: StockService) {}

  @Get()
  getBalances() {
    return this.stockService.getBalances();
  }

  @Get('adjustments')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_STOCK)
  findAdjustments(
    @Query('productId') productId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.stockService.findAllAdjustments({ productId, from, to });
  }

  @Post('adjustments')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_STOCK)
  @UseInterceptors(AuditInterceptor)
  createAdjustment(
    @Body() dto: CreateAdjustmentDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.stockService.createAdjustment(dto, req.user.id);
  }
}
