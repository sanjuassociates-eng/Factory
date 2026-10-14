import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockBalance } from '@steel-factory/shared';
import { CreateAdjustmentDto } from './dto/adjustment.dto';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getBalances(): Promise<StockBalance[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }, { grade: 'asc' }],
    });

    const [production, committedRows, dispatchedRows, adjustmentRows] = await Promise.all([
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
      // Adjustments (signed: negative = damage/wastage, positive = return/correction)
      this.prisma.stockAdjustment.groupBy({
        by: ['productId'],
        _sum: { tonnage: true },
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
    const adjustmentMap = Object.fromEntries(
      adjustmentRows.map((r) => [r.productId, r._sum.tonnage ?? 0]),
    );

    return products.map((product) => {
      const produced = producedMap[product.id] ?? 0;
      const committed = committedMap[product.id] ?? 0;
      const dispatched = dispatchedMap[product.id] ?? 0;
      const adjusted = adjustmentMap[product.id] ?? 0;
      const available = produced - committed - dispatched + adjusted;
      return {
        productId: product.id,
        productName: product.name,
        grade: product.grade,
        unit: product.unit,
        produced,
        committed,
        dispatched,
        adjusted,
        available,
      };
    });
  }

  async createAdjustment(dto: CreateAdjustmentDto, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    return this.prisma.stockAdjustment.create({
      data: {
        productId: dto.productId,
        tonnage: dto.tonnage,
        type: dto.type,
        reason: dto.reason,
        date: new Date(dto.date),
        createdBy: userId,
        notes: dto.notes,
      },
      include: {
        product: { select: { id: true, name: true, grade: true, unit: true } },
        creator: { select: { id: true, name: true } },
      },
    });
  }

  async findAllAdjustments(filters?: { productId?: string; from?: string; to?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.from || filters?.to) {
      where.date = {};
      if (filters.from) (where.date as Record<string, Date>).gte = new Date(filters.from);
      if (filters.to) (where.date as Record<string, Date>).lte = new Date(filters.to);
    }

    return this.prisma.stockAdjustment.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, grade: true, unit: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
