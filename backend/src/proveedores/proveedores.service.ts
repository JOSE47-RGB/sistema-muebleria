import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const proveedores: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        p.id_proveedor,
        p.id_tipo_proveedor,
        tp.nombre AS tipo_proveedor,
        p.codigo_proveedor,
        p.nombre,
        p.telefono,
        p.direccion,
        p.estado
      FROM proveedores p
      INNER JOIN tipos_proveedor tp
        ON tp.id_tipo_proveedor = p.id_tipo_proveedor
      ORDER BY p.id_proveedor DESC
    `);

    return proveedores.map((p) => ({
      id_proveedor: Number(p.id_proveedor),
      id_tipo_proveedor: Number(p.id_tipo_proveedor),
      tipo_proveedor: p.tipo_proveedor,
      codigo_proveedor: p.codigo_proveedor,
      nombre: p.nombre,
      telefono: p.telefono,
      direccion: p.direccion,
      estado: Number(p.estado),
    }));
  }

  async obtener(id: number) {
    const proveedores: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        p.id_proveedor,
        p.id_tipo_proveedor,
        tp.nombre AS tipo_proveedor,
        p.codigo_proveedor,
        p.nombre,
        p.telefono,
        p.direccion,
        p.estado
      FROM proveedores p
      INNER JOIN tipos_proveedor tp
        ON tp.id_tipo_proveedor = p.id_tipo_proveedor
      WHERE p.id_proveedor = ?
      LIMIT 1
      `,
      id,
    );

    if (proveedores.length === 0) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    const p = proveedores[0];

    return {
      id_proveedor: Number(p.id_proveedor),
      id_tipo_proveedor: Number(p.id_tipo_proveedor),
      tipo_proveedor: p.tipo_proveedor,
      codigo_proveedor: p.codigo_proveedor,
      nombre: p.nombre,
      telefono: p.telefono,
      direccion: p.direccion,
      estado: Number(p.estado),
    };
  }

  async crear(data: CreateProveedorDto) {
    const idTipoProveedor = Number(data.id_tipo_proveedor || 2);
    const codigo = data.codigo_proveedor.trim().toUpperCase();
    const nombre = data.nombre.trim();

    if (!idTipoProveedor || !codigo || !nombre) {
      throw new BadRequestException(
        'Tipo, código y nombre son obligatorios',
      );
    }

    const tipoExiste: any[] = await this.prisma.$queryRaw`
      SELECT id_tipo_proveedor
      FROM tipos_proveedor
      WHERE id_tipo_proveedor = ${idTipoProveedor}
        AND estado = 1
      LIMIT 1
    `;

    if (tipoExiste.length === 0) {
      throw new BadRequestException('El tipo de proveedor no existe');
    }

    const existe: any[] = await this.prisma.$queryRaw`
      SELECT id_proveedor
      FROM proveedores
      WHERE codigo_proveedor = ${codigo}
         OR nombre = ${nombre}
      LIMIT 1
    `;

    if (existe.length > 0) {
      throw new BadRequestException(
        'Ya existe un proveedor con ese código o nombre',
      );
    }

    await this.prisma.$executeRaw`
      INSERT INTO proveedores (
        id_tipo_proveedor,
        codigo_proveedor,
        nombre,
        telefono,
        direccion,
        estado
      ) VALUES (
        ${idTipoProveedor},
        ${codigo},
        ${nombre},
        ${data.telefono || null},
        ${data.direccion || null},
        1
      )
    `;

    return {
      mensaje: 'Proveedor creado correctamente',
    };
  }

  async desactivar(id: number) {
    await this.obtener(id);

    await this.prisma.$executeRaw`
      UPDATE proveedores
      SET estado = 0
      WHERE id_proveedor = ${id}
    `;

    return {
      mensaje: 'Proveedor desactivado correctamente',
      id_proveedor: id,
    };
  }
}