import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('categorias')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class CategoriasController {
  constructor(
    private readonly categoriasService: CategoriasService,
  ) {}

  @Post()
  @Permiso('categorias.crear')
  crear(@Body() data: CreateCategoriaDto) {
    return this.categoriasService.crear(data);
  }

  @Get()
  @Permiso('categorias.ver')
  listar() {
    return this.categoriasService.listar();
  }

  @Get(':id')
  @Permiso('categorias.ver')
  obtener(@Param('id') id: string) {
    return this.categoriasService.obtener(Number(id));
  }

  @Patch(':id/desactivar')
  @Permiso('categorias.editar')
  desactivar(@Param('id') id: string) {
    return this.categoriasService.desactivar(Number(id));
  }
}