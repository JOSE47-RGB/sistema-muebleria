import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('productos')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ProductosController {
  constructor(
    private readonly productosService: ProductosService,
  ) {}

  @Post()
  @Permiso('productos.crear')
  crear(@Body() data: CreateProductoDto) {
    return this.productosService.crear(data);
  }

  @Get()
  @Permiso('productos.ver')
  listar() {
    return this.productosService.listar();
  }

  @Get('catalogos')
  @Permiso('productos.ver')
  catalogos() {
    return this.productosService.catalogos();
  }

  @Get(':id')
  @Permiso('productos.ver')
  obtener(@Param('id') id: string) {
    return this.productosService.obtener(Number(id));
  }

  @Patch(':id/desactivar')
  @Permiso('productos.editar')
  desactivar(@Param('id') id: string) {
    return this.productosService.desactivar(Number(id));
  }
}