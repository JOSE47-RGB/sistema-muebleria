import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ApartadosController } from './apartados.controller';
import { ApartadosService } from './apartados.service';

@Module({
  imports: [PrismaModule],
  controllers: [ApartadosController],
  providers: [ApartadosService],
  exports: [ApartadosService],
})
export class ApartadosModule {}