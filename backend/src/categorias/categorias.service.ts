import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const categorias: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        c.id_categoria,
        c.id_tipo_categoria,
        tc.nombre AS tipo_categoria,
        c.codigo_categoria,
        c.nombre,
        c.estado
      FROM categorias c
      INNER JOIN tipos_categoria tc
        ON tc.id_tipo_categoria = c.id_tipo_categoria
      ORDER BY c.id_categoria DESC
    `);

    return categorias.map((c) => ({
      id_categoria: Number(c.id_categoria),
      id_tipo_categoria: Number(c.id_tipo_categoria),
      tipo_categoria: c.tipo_categoria,
      codigo_categoria: c.codigo_categoria,
      nombre: c.nombre,
      estado: Number(c.estado),
    }));
  }

  async obtener(id: number) {
    const categorias: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        c.id_categoria,
        c.id_tipo_categoria,
        tc.nombre AS tipo_categoria,
        c.codigo_categoria,
        c.nombre,
        c.estado
      FROM categorias c
      INNER JOIN tipos_categoria tc
        ON tc.id_tipo_categoria = c.id_tipo_categoria
      WHERE c.id_categoria = ?
      LIMIT 1
      `,
      id,
    );

    if (categorias.length === 0) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const c = categorias[0];

    return {
      id_categoria: Number(c.id_categoria),
      id_tipo_categoria: Number(c.id_tipo_categoria),
      tipo_categoria: c.tipo_categoria,
      codigo_categoria: c.codigo_categoria,
      nombre: c.nombre,
      estado: Number(c.estado),
    };
  }

  async crear(data: CreateCategoriaDto) {
    const codigo = data.codigo_categoria.trim().toUpperCase();
    const nombre = data.nombre.trim();
    const idTipoCategoria = Number(data.id_tipo_categoria);

    if (!idTipoCategoria || !codigo || !nombre) {
      throw new BadRequestException(
        'Tipo, código y nombre son obligatorios',
      );
    }

    const tipoExiste: any[] = await this.prisma.$queryRaw`
      SELECT id_tipo_categoria
      FROM tipos_categoria
      WHERE id_tipo_categoria = ${idTipoCategoria}
        AND estado = 1
      LIMIT 1
    `;

    if (tipoExiste.length === 0) {
      throw new BadRequestException('El tipo de categoría no existe');
    }

    const existe: any[] = await this.prisma.$queryRaw`
      SELECT id_categoria
      FROM categorias
      WHERE codigo_categoria = ${codigo}
         OR nombre = ${nombre}
      LIMIT 1
    `;

    if (existe.length > 0) {
      throw new BadRequestException(
        'Ya existe una categoría con ese código o nombre',
      );
    }

    await this.prisma.$executeRaw`
      INSERT INTO categorias (
        id_tipo_categoria,
        codigo_categoria,
        nombre,
        estado
      ) VALUES (
        ${idTipoCategoria},
        ${codigo},
        ${nombre},
        1
      )
    `;

    const creada: any[] = await this.prisma.$queryRaw`
      SELECT
        c.id_categoria,
        c.id_tipo_categoria,
        tc.nombre AS tipo_categoria,
        c.codigo_categoria,
        c.nombre,
        c.estado
      FROM categorias c
      INNER JOIN tipos_categoria tc
        ON tc.id_tipo_categoria = c.id_tipo_categoria
      WHERE c.codigo_categoria = ${codigo}
      LIMIT 1
    `;

    const c = creada[0];

    return {
      mensaje: 'Categoría creada correctamente',
      categoria: {
        id_categoria: Number(c.id_categoria),
        id_tipo_categoria: Number(c.id_tipo_categoria),
        tipo_categoria: c.tipo_categoria,
        codigo_categoria: c.codigo_categoria,
        nombre: c.nombre,
        estado: Number(c.estado),
      },
    };
  }

  async desactivar(id: number) {
    await this.obtener(id);

    await this.prisma.$executeRaw`
      UPDATE categorias
      SET estado = 0
      WHERE id_categoria = ${id}
    `;

    return {
      mensaje: 'Categoría desactivada correctamente',
      id_categoria: id,
    };
  }
}