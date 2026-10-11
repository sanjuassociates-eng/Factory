import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(activeOnly = false) {
    return this.prisma.product.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ name: 'asc' }, { grade: 'asc' }],
    });
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { name: dto.name, grade: dto.grade, unit: dto.unit || 'MT' },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }
}
