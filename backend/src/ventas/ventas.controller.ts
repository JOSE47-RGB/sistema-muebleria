import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { Permiso } from '../common/decorators/permiso.decorator';

type RequestConUsuario = Request & {
  user: {
    sub: number;
    email: string;
    usuario: string;
  };
};

@Controller('ventas')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class VentasController {
  constructor(
    private readonly ventasService: VentasService,
  ) {}

  @Get('catalogos')
  @Permiso('ventas.ver')
  catalogos(@Req() request: RequestConUsuario) {
    return this.ventasService.catalogos(
      Number(request.user.sub),
    );
  }

  @Get()
  @Permiso('ventas.ver')
  listar(
    @Req() request: RequestConUsuario,
    @Query('fecha_inicio') fechaInicio?: string,
    @Query('fecha_fin') fechaFin?: string,
    @Query('buscar') buscar?: string,
  ) {
    return this.ventasService.listar(
      Number(request.user.sub),
      {
        fechaInicio,
        fechaFin,
        buscar,
      },
    );
  }

  @Get(':id')
  @Permiso('ventas.ver')
  obtener(
    @Req() request: RequestConUsuario,
    @Param('id') id: string,
  ) {
    return this.ventasService.obtener(
      Number(id),
      Number(request.user.sub),
    );
  }

  @Post()
  @Permiso('ventas.crear')
  crear(
    @Req() request: RequestConUsuario,
    @Body() data: CreateVentaDto,
  ) {
    return this.ventasService.crear(
      data,
      Number(request.user.sub),
    );
  }
}