import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuyerDto, UpdateBuyerDto } from './dto/buyer.dto';

@Injectable()
export class BuyersService {
  constructor(private prisma: PrismaService) {}

  findAll(query?: string) {
    const where = query
      ? {
          isActive: true,
          name: { contains: query, mode: 'insensitive' as const },
        }
      : { isActive: true };

    return this.prisma.buyer.findMany({
      where,
      select: {
        id: true,
        name: true,
        contact: true,
        address: true,
        isActive: true,
        createdAt: true,
        _count: { select: { vehicles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.buyer.findUniqueOrThrow({
      where: { id },
      include: {
        vehicles: {
          include: {
            items: {
              include: { product: { select: { id: true, name: true, grade: true, unit: true } } },
            },
            registrar: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  create(dto: CreateBuyerDto, createdBy: string) {
    return this.prisma.buyer.create({
      data: { name: dto.name, contact: dto.contact, address: dto.address, createdBy },
      select: { id: true, name: true, contact: true, address: true, isActive: true, createdAt: true },
    });
  }

  async update(id: string, dto: UpdateBuyerDto) {
    await this.prisma.buyer.findUniqueOrThrow({ where: { id } });
    return this.prisma.buyer.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, contact: true, address: true, isActive: true, createdAt: true },
    });
  }
}
