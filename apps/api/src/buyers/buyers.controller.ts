import {
  Body,
  Controller,
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
import { Permission } from '@steel-factory/shared';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { BuyersService } from './buyers.service';
import { CreateBuyerDto, UpdateBuyerDto } from './dto/buyer.dto';

@Controller('buyers')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class BuyersController {
  constructor(private buyersService: BuyersService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.buyersService.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buyersService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.MANAGE_BUYERS)
  @UseInterceptors(AuditInterceptor)
  create(@Body() dto: CreateBuyerDto, @Req() req: { user: { id: string } }) {
    return this.buyersService.create(dto, req.user.id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.MANAGE_BUYERS)
  @UseInterceptors(AuditInterceptor)
  update(@Param('id') id: string, @Body() dto: UpdateBuyerDto) {
    return this.buyersService.update(id, dto);
  }
}
