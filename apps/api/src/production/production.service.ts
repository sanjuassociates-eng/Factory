import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductionDto, UpdateProductionDto } from './dto/production.dto';

const LOG_INCLUDE = {
  product: { select: { id: true, name: true, grade: true, unit: true } },
  operator: { select: { id: true, name: true } },
};

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
      include: LOG_INCLUDE,
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
      include: LOG_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateProductionDto) {
    const log = await this.prisma.productionLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Production log not found');

    if (dto.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product || !product.isActive) throw new NotFoundException('Product not found');
    }

    return this.prisma.productionLog.update({
      where: { id },
      data: {
        ...(dto.productId && { productId: dto.productId }),
        ...(dto.tonnage !== undefined && { tonnage: dto.tonnage }),
        ...(dto.pricePerUnit !== undefined && { pricePerUnit: dto.pricePerUnit }),
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: LOG_INCLUDE,
    });
  }

  async remove(id: string) {
    const log = await this.prisma.productionLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Production log not found');
    return this.prisma.productionLog.delete({ where: { id } });
  }
}
