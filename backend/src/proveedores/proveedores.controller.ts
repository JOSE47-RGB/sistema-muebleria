import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('proveedores')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ProveedoresController {
  constructor(
    private readonly proveedoresService: ProveedoresService,
  ) {}

  @Post()
  @Permiso('proveedores.crear')
  crear(@Body() data: CreateProveedorDto) {
    return this.proveedoresService.crear(data);
  }

  @Get()
  @Permiso('proveedores.ver')
  listar() {
    return this.proveedoresService.listar();
  }

  @Get(':id')
  @Permiso('proveedores.ver')
  obtener(@Param('id') id: string) {
    return this.proveedoresService.obtener(Number(id));
  }

  @Patch(':id/desactivar')
  @Permiso('proveedores.editar')
  desactivar(@Param('id') id: string) {
    return this.proveedoresService.desactivar(Number(id));
  }
}