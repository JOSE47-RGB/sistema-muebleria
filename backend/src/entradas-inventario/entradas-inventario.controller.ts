import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { EntradasInventarioService } from './entradas-inventario.service';
import { CreateEntradaInventarioDto } from './dto/create-entrada-inventario.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('entradas-inventario')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class EntradasInventarioController {
  constructor(
    private readonly entradasService: EntradasInventarioService,
  ) {}

  @Post()
  @Permiso('entradas_inventario.crear')
  crear(@Body() data: CreateEntradaInventarioDto) {
    return this.entradasService.crear(data);
  }

  @Get()
  @Permiso('entradas_inventario.ver')
  listar() {
    return this.entradasService.listar();
  }

  @Get('catalogos')
  @Permiso('entradas_inventario.ver')
  catalogos() {
    return this.entradasService.catalogos();
  }
}