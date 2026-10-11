import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const userId = req.user?.id;

    if (!userId || method === 'GET') {
      return next.handle();
    }

    const actionMap: Record<string, AuditAction> = {
      POST: AuditAction.CREATE,
      PATCH: AuditAction.UPDATE,
      PUT: AuditAction.UPDATE,
      DELETE: AuditAction.DELETE,
    };
    const action = actionMap[method];
    if (!action) return next.handle();

    const entity = this.extractEntity(req.url);
    const body = req.body;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId,
              action,
              entity,
              entityId: result?.id || body?.id || 'unknown',
              after: result ? JSON.parse(JSON.stringify(result)) : body,
            },
          });
        } catch {
          // audit failure should not block request
        }
      }),
    );
  }

  private extractEntity(url: string): string {
    const parts = url.replace('/api/', '').split('/').filter(Boolean);
    return parts[0] || 'unknown';
  }
}
