import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto';

@Injectable()
export class UnidadesMedidaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const unidades: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        id_unidad_medida,
        codigo_unidad,
        nombre,
        abreviatura,
        estado
      FROM unidades_medida
      ORDER BY id_unidad_medida DESC
    `);

    return unidades.map((u) => ({
      id_unidad_medida: Number(u.id_unidad_medida),
      codigo_unidad: u.codigo_unidad,
      nombre: u.nombre,
      abreviatura: u.abreviatura,
      estado: Number(u.estado),
    }));
  }

  async obtener(id: number) {
    const unidades: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        id_unidad_medida,
        codigo_unidad,
        nombre,
        abreviatura,
        estado
      FROM unidades_medida
      WHERE id_unidad_medida = ?
      LIMIT 1
      `,
      id,
    );

    if (unidades.length === 0) {
      throw new NotFoundException('Unidad de medida no encontrada');
    }

    const u = unidades[0];

    return {
      id_unidad_medida: Number(u.id_unidad_medida),
      codigo_unidad: u.codigo_unidad,
      nombre: u.nombre,
      abreviatura: u.abreviatura,
      estado: Number(u.estado),
    };
  }

  async crear(data: CreateUnidadMedidaDto) {
    const codigo = data.codigo_unidad.trim().toUpperCase();
    const nombre = data.nombre.trim();
    const abreviatura = data.abreviatura.trim();

    if (!codigo || !nombre || !abreviatura) {
      throw new BadRequestException(
        'Código, nombre y abreviatura son obligatorios',
      );
    }

    const existe: any[] = await this.prisma.$queryRaw`
      SELECT id_unidad_medida
      FROM unidades_medida
      WHERE codigo_unidad = ${codigo}
         OR nombre = ${nombre}
         OR abreviatura = ${abreviatura}
      LIMIT 1
    `;

    if (existe.length > 0) {
      throw new BadRequestException(
        'Ya existe una unidad con ese código, nombre o abreviatura',
      );
    }

    await this.prisma.$executeRaw`
      INSERT INTO unidades_medida (
        codigo_unidad,
        nombre,
        abreviatura,
        estado
      ) VALUES (
        ${codigo},
        ${nombre},
        ${abreviatura},
        1
      )
    `;

    return {
      mensaje: 'Unidad de medida creada correctamente',
    };
  }

  async desactivar(id: number) {
    await this.obtener(id);

    await this.prisma.$executeRaw`
      UPDATE unidades_medida
      SET estado = 0
      WHERE id_unidad_medida = ${id}
    `;

    return {
      mensaje: 'Unidad de medida desactivada correctamente',
      id_unidad_medida: id,
    };
  }
}