import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
  ) {}

  @Post()
  @Permiso('usuarios.crear')
  crear(@Body() data: CreateUsuarioDto) {
    return this.usuariosService.crear(data);
  }

  @Get()
  @Permiso('usuarios.ver')
  listar() {
    return this.usuariosService.listar();
  }

  @Get(':id')
  @Permiso('usuarios.ver')
  obtener(@Param('id') id: string) {
    return this.usuariosService.obtener(Number(id));
  }
}