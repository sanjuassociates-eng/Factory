import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockBalance } from '@steel-factory/shared';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getBalances(): Promise<StockBalance[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }, { grade: 'asc' }],
    });

    const [production, committedRows, dispatchedRows] = await Promise.all([
      this.prisma.productionLog.groupBy({
        by: ['productId'],
        _sum: { tonnage: true },
      }),
      // Committed = vehicle items where vehicle is REGISTERED (reserved but not yet picked up)
      this.prisma.vehicleItem.groupBy({
        by: ['productId'],
        _sum: { tonnage: true },
        where: { vehicle: { status: 'REGISTERED' } },
      }),
      // Dispatched = vehicle items where vehicle is PICKED_UP
      this.prisma.vehicleItem.groupBy({
        by: ['productId'],
        _sum: { tonnage: true },
        where: { vehicle: { status: 'PICKED_UP' } },
      }),
    ]);

    const producedMap = Object.fromEntries(
      production.map((p) => [p.productId, p._sum.tonnage ?? 0]),
    );
    const committedMap = Object.fromEntries(
      committedRows.map((r) => [r.productId, r._sum.tonnage ?? 0]),
    );
    const dispatchedMap = Object.fromEntries(
      dispatchedRows.map((r) => [r.productId, r._sum.tonnage ?? 0]),
    );

    return products.map((product) => {
      const produced = producedMap[product.id] ?? 0;
      const committed = committedMap[product.id] ?? 0;
      const dispatched = dispatchedMap[product.id] ?? 0;
      const available = produced - committed - dispatched;
      return {
        productId: product.id,
        productName: product.name,
        grade: product.grade,
        unit: product.unit,
        produced,
        committed,
        dispatched,
        available,
      };
    });
  }
}
