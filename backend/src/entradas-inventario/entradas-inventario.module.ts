import { Module } from '@nestjs/common';
import { EntradasInventarioController } from './entradas-inventario.controller';
import { EntradasInventarioService } from './entradas-inventario.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EntradasInventarioController],
  providers: [EntradasInventarioService],
})
export class EntradasInventarioModule {}