import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { ApartadosService } from './apartados.service';

import { CreateApartadoDto } from './dto/create-apartado.dto';
import { RegistrarAbonoDto } from './dto/registrar-abono.dto';
import { CancelarApartadoDto } from './dto/cancelar-apartado.dto';

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

@Controller('apartados')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ApartadosController {
  constructor(
    private readonly apartadosService: ApartadosService,
  ) {}

  @Get('catalogos')
  @Permiso('apartados.ver')
  catalogos(@Req() request: RequestConUsuario) {
    return this.apartadosService.catalogos(
      Number(request.user.sub),
    );
  }

  @Get()
  @Permiso('apartados.ver')
  listar(
    @Req() request: RequestConUsuario,
    @Query('estado') estado?: string,
    @Query('buscar') buscar?: string,
  ) {
    return this.apartadosService.listar(
      Number(request.user.sub),
      {
        estado,
        buscar,
      },
    );
  }

  @Get(':id')
  @Permiso('apartados.ver')
  obtener(
    @Req() request: RequestConUsuario,
    @Param('id') id: string,
  ) {
    return this.apartadosService.obtener(
      Number(id),
      Number(request.user.sub),
    );
  }

  @Post()
  @Permiso('apartados.crear')
  crear(
    @Req() request: RequestConUsuario,
    @Body() data: CreateApartadoDto,
  ) {
    return this.apartadosService.crear(
      data,
      Number(request.user.sub),
    );
  }

  @Post(':id/abonos')
  @Permiso('apartados.abonar')
  registrarAbono(
    @Req() request: RequestConUsuario,
    @Param('id') id: string,
    @Body() data: RegistrarAbonoDto,
  ) {
    return this.apartadosService.registrarAbono(
      Number(id),
      data,
      Number(request.user.sub),
    );
  }

  @Patch(':id/entregar')
  @Permiso('apartados.abonar')
  entregar(
    @Req() request: RequestConUsuario,
    @Param('id') id: string,
  ) {
    return this.apartadosService.entregar(
      Number(id),
      Number(request.user.sub),
    );
  }

  @Patch(':id/cancelar')
  @Permiso('apartados.anular')
  cancelar(
    @Req() request: RequestConUsuario,
    @Param('id') id: string,
    @Body() data: CancelarApartadoDto,
  ) {
    return this.apartadosService.cancelar(
      Number(id),
      data,
      Number(request.user.sub),
    );
  }
}