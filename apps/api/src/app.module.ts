import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { ProductionModule } from './production/production.module';
import { StockModule } from './stock/stock.module';
import { BuyersModule } from './buyers/buyers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    ProductionModule,
    StockModule,
    BuyersModule,
    VehiclesModule,
    AuditModule,
  ],
})
export class AppModule {}
