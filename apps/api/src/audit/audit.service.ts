import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: {
    entity?: string;
    userId?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.entity) where.entity = filters.entity;
    if (filters.userId) where.userId = filters.userId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Record<string, Date>).gte = new Date(filters.from);
      if (filters.to) (where.createdAt as Record<string, Date>).lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page: filters.page, limit: filters.limit };
  }
}
