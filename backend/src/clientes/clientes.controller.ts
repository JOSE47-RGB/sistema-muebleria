import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('clientes')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ClientesController {
  constructor(
    private readonly clientesService: ClientesService,
  ) {}

  @Get('tipos')
  @Permiso('clientes.ver')
  listarTiposCliente() {
    return this.clientesService.listarTiposCliente();
  }

  @Get()
  @Permiso('clientes.ver')
  listar() {
    return this.clientesService.listar();
  }

  @Get(':id')
  @Permiso('clientes.ver')
  obtener(@Param('id') id: string) {
    return this.clientesService.obtener(Number(id));
  }

  @Post()
  @Permiso('clientes.crear')
  crear(@Body() data: CreateClienteDto) {
    return this.clientesService.crear(data);
  }

  @Patch(':id/desactivar')
  @Permiso('clientes.desactivar')
  desactivar(@Param('id') id: string) {
    return this.clientesService.desactivar(Number(id));
  }

  @Patch(':id/activar')
  @Permiso('clientes.editar')
  activar(@Param('id') id: string) {
    return this.clientesService.activar(Number(id));
  }
}