import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarcaDto } from './dto/create-marca.dto';

@Injectable()
export class MarcasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const marcas: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        id_marca,
        codigo_marca,
        nombre,
        estado
      FROM marcas
      ORDER BY id_marca DESC
    `);

    return marcas.map((m) => ({
      id_marca: Number(m.id_marca),
      codigo_marca: m.codigo_marca,
      nombre: m.nombre,
      estado: Number(m.estado),
    }));
  }

  async obtener(id: number) {
    const marcas: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        id_marca,
        codigo_marca,
        nombre,
        estado
      FROM marcas
      WHERE id_marca = ?
      LIMIT 1
      `,
      id,
    );

    if (marcas.length === 0) {
      throw new NotFoundException('Marca no encontrada');
    }

    const m = marcas[0];

    return {
      id_marca: Number(m.id_marca),
      codigo_marca: m.codigo_marca,
      nombre: m.nombre,
      estado: Number(m.estado),
    };
  }

  async crear(data: CreateMarcaDto) {
    const codigo = data.codigo_marca.trim().toUpperCase();
    const nombre = data.nombre.trim();

    if (!codigo || !nombre) {
      throw new BadRequestException('Código y nombre son obligatorios');
    }

    const existe: any[] = await this.prisma.$queryRaw`
      SELECT id_marca
      FROM marcas
      WHERE codigo_marca = ${codigo}
         OR nombre = ${nombre}
      LIMIT 1
    `;

    if (existe.length > 0) {
      throw new BadRequestException(
        'Ya existe una marca con ese código o nombre',
      );
    }

    await this.prisma.$executeRaw`
      INSERT INTO marcas (
        codigo_marca,
        nombre,
        estado
      ) VALUES (
        ${codigo},
        ${nombre},
        1
      )
    `;

    return {
      mensaje: 'Marca creada correctamente',
    };
  }

  async desactivar(id: number) {
    await this.obtener(id);

    await this.prisma.$executeRaw`
      UPDATE marcas
      SET estado = 0
      WHERE id_marca = ${id}
    `;

    return {
      mensaje: 'Marca desactivada correctamente',
      id_marca: id,
    };
  }
}