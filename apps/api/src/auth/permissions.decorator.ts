import { SetMetadata } from '@nestjs/common';
import { Permission } from '@steel-factory/shared';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...perms: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, perms);
