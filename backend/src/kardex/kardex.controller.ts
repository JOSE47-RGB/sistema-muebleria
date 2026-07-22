import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { KardexService } from './kardex.service';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('kardex')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class KardexController {
  constructor(
    private readonly kardexService: KardexService,
  ) {}

  @Get()
  @Permiso('kardex.ver')
  listar(
    @Query('id_sucursal') idSucursal?: string,
    @Query('id_variante') idVariante?: string,
    @Query('id_tipo_movimiento') idTipoMovimiento?: string,
    @Query('fecha_inicio') fechaInicio?: string,
    @Query('fecha_fin') fechaFin?: string,
  ) {
    return this.kardexService.listar({
      idSucursal: idSucursal
        ? Number(idSucursal)
        : undefined,
      idVariante: idVariante
        ? Number(idVariante)
        : undefined,
      idTipoMovimiento: idTipoMovimiento
        ? Number(idTipoMovimiento)
        : undefined,
      fechaInicio,
      fechaFin,
    });
  }

  @Get('catalogos')
  @Permiso('kardex.ver')
  catalogos() {
    return this.kardexService.catalogos();
  }
}