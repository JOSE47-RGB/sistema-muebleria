import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async catalogos() {
    const categorias: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id_categoria, nombre
      FROM categorias
      WHERE estado = 1
      ORDER BY nombre ASC
    `);

    const marcas: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id_marca, nombre
      FROM marcas
      WHERE estado = 1
      ORDER BY nombre ASC
    `);

    const unidades: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id_unidad_medida, nombre, abreviatura
      FROM unidades_medida
      WHERE estado = 1
      ORDER BY nombre ASC
    `);

    return {
      categorias: categorias.map((c) => ({
        id_categoria: Number(c.id_categoria),
        nombre: c.nombre,
      })),
      marcas: marcas.map((m) => ({
        id_marca: Number(m.id_marca),
        nombre: m.nombre,
      })),
      unidades: unidades.map((u) => ({
        id_unidad_medida: Number(u.id_unidad_medida),
        nombre: u.nombre,
        abreviatura: u.abreviatura,
      })),
    };
  }

  async listar() {
    const productos: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        p.id_producto,
        p.codigo_producto,
        p.nombre,
        p.descripcion,
        p.estado,
        c.nombre AS categoria,
        m.nombre AS marca,
        pv.id_variante,
        pv.codigo_variante,
        pv.precio_venta,
        um.nombre AS unidad_medida,
        um.abreviatura
      FROM productos p
      INNER JOIN categorias c ON c.id_categoria = p.id_categoria
      LEFT JOIN marcas m ON m.id_marca = p.id_marca
      LEFT JOIN producto_variantes pv ON pv.id_producto = p.id_producto
      LEFT JOIN unidades_medida um ON um.id_unidad_medida = pv.id_unidad_medida
      ORDER BY p.id_producto DESC
    `);

    return productos.map((p) => ({
      id_producto: Number(p.id_producto),
      codigo_producto: p.codigo_producto,
      nombre: p.nombre,
      descripcion: p.descripcion,
      estado: Number(p.estado),
      categoria: p.categoria,
      marca: p.marca,
      id_variante: p.id_variante ? Number(p.id_variante) : null,
      codigo_variante: p.codigo_variante,
      precio_venta: p.precio_venta ? Number(p.precio_venta) : 0,
      unidad_medida: p.unidad_medida,
      abreviatura: p.abreviatura,
    }));
  }

  async obtener(id: number) {
    const productos: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        p.id_producto,
        p.codigo_producto,
        p.id_categoria,
        p.id_marca,
        p.nombre,
        p.descripcion,
        p.estado,
        pv.id_variante,
        pv.id_unidad_medida,
        pv.codigo_variante,
        pv.color,
        pv.material,
        pv.medida,
        pv.precio_venta
      FROM productos p
      LEFT JOIN producto_variantes pv ON pv.id_producto = p.id_producto
      WHERE p.id_producto = ?
      LIMIT 1
      `,
      id,
    );

    if (productos.length === 0) {
      throw new NotFoundException('Producto no encontrado');
    }

    const p = productos[0];

    return {
      ...p,
      id_producto: Number(p.id_producto),
      id_categoria: Number(p.id_categoria),
      id_marca: p.id_marca ? Number(p.id_marca) : null,
      id_variante: p.id_variante ? Number(p.id_variante) : null,
      id_unidad_medida: p.id_unidad_medida
        ? Number(p.id_unidad_medida)
        : null,
      precio_venta: p.precio_venta ? Number(p.precio_venta) : 0,
      estado: Number(p.estado),
    };
  }

  async crear(data: CreateProductoDto) {
    const codigoProducto = data.codigo_producto.trim().toUpperCase();
    const codigoVariante = data.codigo_variante.trim().toUpperCase();
    const nombre = data.nombre.trim();
    const precio = Number(data.precio_venta);

    if (!codigoProducto || !codigoVariante || !nombre || precio <= 0) {
      throw new BadRequestException(
        'Código, nombre, variante y precio son obligatorios',
      );
    }

    const existeProducto: any[] = await this.prisma.$queryRaw`
      SELECT id_producto
      FROM productos
      WHERE codigo_producto = ${codigoProducto}
      LIMIT 1
    `;

    if (existeProducto.length > 0) {
      throw new BadRequestException('Ya existe un producto con ese código');
    }

    const existeVariante: any[] = await this.prisma.$queryRaw`
      SELECT id_variante
      FROM producto_variantes
      WHERE codigo_variante = ${codigoVariante}
      LIMIT 1
    `;

    if (existeVariante.length > 0) {
      throw new BadRequestException('Ya existe una variante con ese código');
    }

    const categoria: any[] = await this.prisma.$queryRaw`
      SELECT id_categoria
      FROM categorias
      WHERE id_categoria = ${Number(data.id_categoria)}
        AND estado = 1
      LIMIT 1
    `;

    if (categoria.length === 0) {
      throw new BadRequestException('La categoría no existe');
    }

    if (data.id_marca) {
      const marca: any[] = await this.prisma.$queryRaw`
        SELECT id_marca
        FROM marcas
        WHERE id_marca = ${Number(data.id_marca)}
          AND estado = 1
        LIMIT 1
      `;

      if (marca.length === 0) {
        throw new BadRequestException('La marca no existe');
      }
    }

    if (data.id_unidad_medida) {
      const unidad: any[] = await this.prisma.$queryRaw`
        SELECT id_unidad_medida
        FROM unidades_medida
        WHERE id_unidad_medida = ${Number(data.id_unidad_medida)}
          AND estado = 1
        LIMIT 1
      `;

      if (unidad.length === 0) {
        throw new BadRequestException('La unidad de medida no existe');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO productos (
          codigo_producto,
          id_categoria,
          id_marca,
          nombre,
          descripcion,
          estado
        ) VALUES (
          ${codigoProducto},
          ${Number(data.id_categoria)},
          ${data.id_marca ? Number(data.id_marca) : null},
          ${nombre},
          ${data.descripcion || null},
          1
        )
      `;

      const productoCreado: any[] = await tx.$queryRaw`
        SELECT id_producto
        FROM productos
        WHERE codigo_producto = ${codigoProducto}
        LIMIT 1
      `;

      const idProducto = productoCreado[0].id_producto;

      await tx.$executeRaw`
        INSERT INTO producto_variantes (
          id_producto,
          id_unidad_medida,
          codigo_variante,
          color,
          material,
          medida,
          precio_venta,
          estado
        ) VALUES (
          ${idProducto},
          ${data.id_unidad_medida ? Number(data.id_unidad_medida) : null},
          ${codigoVariante},
          ${data.color || null},
          ${data.material || null},
          ${data.medida || null},
          ${precio},
          1
        )
      `;

      return {
        mensaje: 'Producto creado correctamente',
        producto: {
          id_producto: Number(idProducto),
          codigo_producto: codigoProducto,
          nombre,
        },
      };
    });
  }

  async desactivar(id: number) {
    await this.obtener(id);

    await this.prisma.$executeRaw`
      UPDATE productos
      SET estado = 0
      WHERE id_producto = ${id}
    `;

    await this.prisma.$executeRaw`
      UPDATE producto_variantes
      SET estado = 0
      WHERE id_producto = ${id}
    `;

    return {
      mensaje: 'Producto desactivado correctamente',
      id_producto: id,
    };
  }
}