import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VehicleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

const VEHICLE_INCLUDE = {
  buyer: { select: { id: true, name: true, contact: true } },
  registrar: { select: { id: true, name: true } },
  items: {
    include: { product: { select: { id: true, name: true, grade: true, unit: true } } },
  },
};

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  findAll(filters?: { status?: VehicleStatus; buyerId?: string; from?: string; to?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.buyerId) where.buyerId = filters.buyerId;
    if (filters?.from || filters?.to) {
      const dateFilter: Record<string, Date> = {};
      if (filters.from) dateFilter.gte = new Date(filters.from);
      if (filters.to) dateFilter.lte = new Date(filters.to);
      where.createdAt = dateFilter;
    }

    return this.prisma.vehicle.findMany({
      where,
      include: VEHICLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateVehicleDto, registeredBy: string) {
    if (!dto.items?.length) {
      throw new BadRequestException('At least one product item is required');
    }

    const buyer = await this.prisma.buyer.findUnique({ where: { id: dto.buyerId } });
    if (!buyer || !buyer.isActive) throw new NotFoundException('Buyer not found');

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });
    if (products.length !== productIds.length) {
      throw new NotFoundException('One or more products not found');
    }

    const balances = await this.stockService.getBalances();
    const errors: string[] = [];

    for (const item of dto.items) {
      const stock = balances.find((b) => b.productId === item.productId);
      const product = products.find((p) => p.id === item.productId)!;
      if (!stock || stock.available < item.tonnage) {
        errors.push(
          `Insufficient stock for ${product.name} (${product.grade}). Available: ${stock?.available ?? 0} ${product.unit}`,
        );
      }
    }

    if (errors.length) throw new BadRequestException(errors.join('; '));

    return this.prisma.vehicle.create({
      data: {
        buyerId: dto.buyerId,
        vehicleNumber: dto.vehicleNumber.toUpperCase(),
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        notes: dto.notes,
        registeredBy,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            tonnage: item.tonnage,
            pricePerUnit: item.pricePerUnit,
          })),
        },
      },
      include: VEHICLE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.status === VehicleStatus.CANCELLED) {
      throw new BadRequestException('Cannot edit a cancelled vehicle');
    }

    // If items are being replaced, validate stock availability
    if (dto.items?.length) {
      const productIds = [...new Set(dto.items.map((i) => i.productId))];
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more products not found');
      }

      // Adjust available stock: add back what this vehicle currently holds
      const currentItems = await this.prisma.vehicleItem.findMany({ where: { vehicleId: id } });
      const balances = await this.stockService.getBalances();
      const adjusted = new Map(balances.map((b) => [b.productId, b.available]));
      for (const ci of currentItems) {
        adjusted.set(ci.productId, (adjusted.get(ci.productId) ?? 0) + ci.tonnage);
      }

      const errors: string[] = [];
      for (const item of dto.items) {
        const avail = adjusted.get(item.productId) ?? 0;
        const product = products.find((p) => p.id === item.productId)!;
        if (avail < item.tonnage) {
          errors.push(
            `Insufficient stock for ${product.name} (${product.grade}). Available: ${avail} ${product.unit}`,
          );
        }
      }
      if (errors.length) throw new BadRequestException(errors.join('; '));
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(dto.buyerId && { buyerId: dto.buyerId }),
        ...(dto.vehicleNumber && { vehicleNumber: dto.vehicleNumber.toUpperCase() }),
        ...(dto.driverName !== undefined && { driverName: dto.driverName }),
        ...(dto.driverPhone !== undefined && { driverPhone: dto.driverPhone }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.items && {
          items: {
            deleteMany: {},
            create: dto.items.map((item) => ({
              productId: item.productId,
              tonnage: item.tonnage,
              pricePerUnit: item.pricePerUnit,
            })),
          },
        }),
      },
      include: VEHICLE_INCLUDE,
    });
  }

  async markPickup(id: string) {    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.status === VehicleStatus.PICKED_UP) {
      throw new BadRequestException('Vehicle already picked up');
    }
    if (vehicle.status === VehicleStatus.CANCELLED) {
      throw new BadRequestException('Vehicle is cancelled');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.PICKED_UP, pickedUpAt: new Date() },
      include: VEHICLE_INCLUDE,
    });
  }

  async cancel(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.status === VehicleStatus.PICKED_UP) {
      throw new BadRequestException('Cannot cancel a vehicle that has already been picked up');
    }
    if (vehicle.status === VehicleStatus.CANCELLED) {
      throw new BadRequestException('Vehicle is already cancelled');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.CANCELLED },
      include: VEHICLE_INCLUDE,
    });
  }

  async getTodayRevenue(): Promise<number> {
    // Use local midnight so the window matches the user's calendar day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const items = await this.prisma.vehicleItem.findMany({
      where: {
        vehicle: {
          status: VehicleStatus.PICKED_UP,
          pickedUpAt: { gte: startOfDay, lte: endOfDay },
        },
      },
    });

    return items.reduce((sum, item) => sum + item.tonnage * item.pricePerUnit, 0);
  }

  async getRevenueByDay(from?: string, to?: string) {
    // Default: last 30 days. Parse date strings as LOCAL midnight to avoid UTC offset shift.
    const parseLocal = (iso: string, endOfDay = false) => {
      const d = new Date(iso + 'T00:00:00');
      if (endOfDay) d.setHours(23, 59, 59, 999);
      return d;
    };

    const end = to ? parseLocal(to, true) : (() => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; })();
    const start = from
      ? parseLocal(from)
      : (() => { const d = new Date(); d.setDate(d.getDate() - 29); d.setHours(0, 0, 0, 0); return d; })();

    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        status: VehicleStatus.PICKED_UP,
        pickedUpAt: { gte: start, lte: end },
      },
      include: {
        buyer: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, name: true, grade: true, unit: true } } },
        },
      },
      orderBy: { pickedUpAt: 'desc' },
    });

    // Group by date (YYYY-MM-DD)
    const dayMap = new Map<
      string,
      {
        date: string;
        vehicles: number;
        tonnage: number;
        revenue: number;
        breakdown: Map<string, { productName: string; grade: string; unit: string; tonnage: number; revenue: number }>;
      }
    >();

    for (const v of vehicles) {
      const day = v.pickedUpAt!.toISOString().slice(0, 10);
      if (!dayMap.has(day)) {
        dayMap.set(day, { date: day, vehicles: 0, tonnage: 0, revenue: 0, breakdown: new Map() });
      }
      const entry = dayMap.get(day)!;
      entry.vehicles += 1;

      for (const item of v.items) {
        const lineRev = item.tonnage * item.pricePerUnit;
        entry.tonnage += item.tonnage;
        entry.revenue += lineRev;

        const pKey = item.productId;
        if (!entry.breakdown.has(pKey)) {
          entry.breakdown.set(pKey, {
            productName: item.product.name,
            grade: item.product.grade,
            unit: item.product.unit,
            tonnage: 0,
            revenue: 0,
          });
        }
        const pb = entry.breakdown.get(pKey)!;
        pb.tonnage += item.tonnage;
        pb.revenue += lineRev;
      }
    }

    // Serialise
    const days = Array.from(dayMap.values()).map((d) => ({
      date: d.date,
      vehicles: d.vehicles,
      tonnage: d.tonnage,
      revenue: d.revenue,
      breakdown: Array.from(d.breakdown.entries()).map(([productId, b]) => ({
        productId,
        ...b,
      })),
    }));

    const totalRevenue = days.reduce((s, d) => s + d.revenue, 0);
    const totalTonnage = days.reduce((s, d) => s + d.tonnage, 0);
    const totalVehicles = days.reduce((s, d) => s + d.vehicles, 0);

    return { days, totalRevenue, totalTonnage, totalVehicles, from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
  }
}
