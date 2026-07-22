import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../prisma/prisma.service';
import { PERMISO_KEY } from '../decorators/permiso.decorator';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permisoRequerido = this.reflector.getAllAndOverride<string>(
      PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permisoRequerido) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.sub) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const permisos: any[] = await this.prisma.$queryRaw`
      SELECT codigo_permiso
      FROM vw_usuario_permisos
      WHERE id_usuario = ${Number(user.sub)}
        AND codigo_permiso = ${permisoRequerido}
      LIMIT 1
    `;

    if (permisos.length === 0) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }

    return true;
  }
}