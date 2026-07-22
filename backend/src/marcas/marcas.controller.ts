import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { MarcasService } from './marcas.service';
import { CreateMarcaDto } from './dto/create-marca.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('marcas')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class MarcasController {
  constructor(
    private readonly marcasService: MarcasService,
  ) {}

  @Post()
  @Permiso('marcas.crear')
  crear(@Body() data: CreateMarcaDto) {
    return this.marcasService.crear(data);
  }

  @Get()
  @Permiso('marcas.ver')
  listar() {
    return this.marcasService.listar();
  }

  @Get(':id')
  @Permiso('marcas.ver')
  obtener(@Param('id') id: string) {
    return this.marcasService.obtener(Number(id));
  }

  @Patch(':id/desactivar')
  @Permiso('marcas.editar')
  desactivar(@Param('id') id: string) {
    return this.marcasService.desactivar(Number(id));
  }
}