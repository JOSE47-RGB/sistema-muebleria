import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermisosGuard } from './guards/permisos.guard';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    JwtAuthGuard,
    PermisosGuard,
  ],
  exports: [
    JwtAuthGuard,
    PermisosGuard,
  ],
})
export class CommonModule {}