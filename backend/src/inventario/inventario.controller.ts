import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InventarioService } from './inventario.service';
import { MovimientoInventarioDto } from './dto/movimiento-inventario.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('inventario')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class InventarioController {
  constructor(
    private readonly inventarioService: InventarioService,
  ) {}

  @Get()
  @Permiso('inventario.ver')
  listar(
    @Query('id_sucursal') idSucursal?: string,
    @Query('buscar') buscar?: string,
  ) {
    return this.inventarioService.listar(
      idSucursal ? Number(idSucursal) : undefined,
      buscar,
    );
  }

  @Get('catalogos')
  @Permiso('inventario.ver')
  catalogos() {
    return this.inventarioService.catalogos();
  }

  @Get('kardex')
  @Permiso('inventario.ver')
  kardex(
    @Query('id_variante') idVariante?: string,
    @Query('id_sucursal') idSucursal?: string,
  ) {
    return this.inventarioService.kardex(
      idVariante ? Number(idVariante) : undefined,
      idSucursal ? Number(idSucursal) : undefined,
    );
  }

  @Post('entrada')
  @Permiso('inventario.entrada')
  entrada(@Body() data: MovimientoInventarioDto) {
    return this.inventarioService.movimiento(
      data,
      'ENTRADA_COMPRA',
    );
  }

  @Post('ajuste-positivo')
  @Permiso('inventario.ajustar')
  ajustePositivo(@Body() data: MovimientoInventarioDto) {
    return this.inventarioService.movimiento(
      data,
      'AJUSTE_POSITIVO',
    );
  }

  @Post('ajuste-negativo')
  @Permiso('inventario.ajustar')
  ajusteNegativo(@Body() data: MovimientoInventarioDto) {
    return this.inventarioService.movimiento(
      data,
      'AJUSTE_NEGATIVO',
    );
  }

  @Get(':id')
  @Permiso('inventario.ver')
  obtener(@Param('id') id: string) {
    return this.inventarioService.obtener(Number(id));
  }
}