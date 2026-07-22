import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { DocumentosService } from './documentos.service';

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

@Controller('documentos')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class DocumentosController {
  constructor(
    private readonly documentosService: DocumentosService,
  ) {}

  @Get()
  @Permiso('documentos.ver')
  listar(
    @Req() request: RequestConUsuario,
    @Query('buscar') buscar?: string,
  ) {
    return this.documentosService.listar(
      Number(request.user.sub),
      buscar,
    );
  }

  /*
   * Genera el recibo si todavía no existe.
   * Si ya existe, devuelve el mismo documento.
   */
  @Get('venta/:idVenta')
  @Permiso('documentos.ver')
  obtenerPorVenta(
    @Req() request: RequestConUsuario,
    @Param('idVenta') idVenta: string,
  ) {
    return this.documentosService.obtenerPorVenta(
      Number(idVenta),
      Number(request.user.sub),
    );
  }

  @Get(':id')
  @Permiso('documentos.ver')
  obtener(
    @Req() request: RequestConUsuario,
    @Param('id') id: string,
  ) {
    return this.documentosService.obtener(
      Number(id),
      Number(request.user.sub),
    );
  }

  @Post(':id/imprimir')
  @Permiso('documentos.imprimir')
  registrarImpresion(
    @Req() request: RequestConUsuario,
    @Param('id') id: string,
  ) {
    return this.documentosService.registrarImpresion(
      Number(id),
      Number(request.user.sub),
    );
  }
}