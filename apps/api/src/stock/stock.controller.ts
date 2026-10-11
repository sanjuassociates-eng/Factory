import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StockService } from './stock.service';

@Controller('stock')
@UseGuards(AuthGuard('jwt'))
export class StockController {
  constructor(private stockService: StockService) {}

  @Get()
  getBalances() {
    return this.stockService.getBalances();
  }
}
