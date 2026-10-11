import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { StockModule } from '../stock/stock.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [StockModule, AuditModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
