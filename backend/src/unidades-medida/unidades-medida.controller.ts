import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UnidadesMedidaService } from './unidades-medida.service';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('unidades-medida')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class UnidadesMedidaController {
  constructor(
    private readonly unidadesService: UnidadesMedidaService,
  ) {}

  @Post()
  @Permiso('unidades_medida.crear')
  crear(@Body() data: CreateUnidadMedidaDto) {
    return this.unidadesService.crear(data);
  }

  @Get()
  @Permiso('unidades_medida.ver')
  listar() {
    return this.unidadesService.listar();
  }

  @Get(':id')
  @Permiso('unidades_medida.ver')
  obtener(@Param('id') id: string) {
    return this.unidadesService.obtener(Number(id));
  }

  @Patch(':id/desactivar')
  @Permiso('unidades_medida.editar')
  desactivar(@Param('id') id: string) {
    return this.unidadesService.desactivar(Number(id));
  }
}