export const Permission = {
  LOG_PRODUCTION: 'LOG_PRODUCTION',
  MANAGE_PRODUCTS: 'MANAGE_PRODUCTS',
  MANAGE_BUYERS: 'MANAGE_BUYERS',
  DISPATCH_VEHICLES: 'DISPATCH_VEHICLES',
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_STOCK: 'MANAGE_STOCK',
  VIEW_AUDIT: 'VIEW_AUDIT',
  VIEW_REVENUE: 'VIEW_REVENUE',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

export const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

export const VehicleStatus = {
  REGISTERED: 'REGISTERED',
  PICKED_UP: 'PICKED_UP',
} as const;
export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  permissions: Permission[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface StockBalance {
  productId: string;
  productName: string;
  grade: string;
  unit: string;
  produced: number;
  committed: number;
  dispatched: number;
  adjusted: number;
  available: number;
}

export interface VehicleItemInput {
  productId: string;
  tonnage: number;
}
