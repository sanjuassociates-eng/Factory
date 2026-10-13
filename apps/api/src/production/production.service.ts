import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductionDto } from './dto/production.dto';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { from?: string; to?: string; productId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.from || filters?.to) {
      where.date = {};
      if (filters.from) (where.date as Record<string, Date>).gte = new Date(filters.from);
      if (filters.to) (where.date as Record<string, Date>).lte = new Date(filters.to);
    }

    return this.prisma.productionLog.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, grade: true, unit: true } },
        operator: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(dto: CreateProductionDto, operatorId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    return this.prisma.productionLog.create({
      data: {
        productId: dto.productId,
        tonnage: dto.tonnage,
        pricePerUnit: dto.pricePerUnit ?? 0,
        date: new Date(dto.date),
        operatorId,
        notes: dto.notes,
      },
      include: {
        product: { select: { id: true, name: true, grade: true, unit: true } },
        operator: { select: { id: true, name: true } },
      },
    });
  }
}
