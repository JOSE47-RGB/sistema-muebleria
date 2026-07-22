import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntradaInventarioDto } from './dto/create-entrada-inventario.dto';

@Injectable()
export class EntradasInventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async catalogos() {
    const sucursales: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id_sucursal, nombre
      FROM sucursales
      WHERE estado = 1
      ORDER BY nombre ASC
    `);

    const variantes: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        pv.id_variante,
        pv.codigo_variante,
        p.codigo_producto,
        p.nombre AS producto
      FROM producto_variantes pv
      INNER JOIN productos p ON p.id_producto = pv.id_producto
      WHERE pv.estado = 1
        AND p.estado = 1
      ORDER BY p.nombre ASC
    `);

    const proveedores: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id_proveedor, nombre
      FROM proveedores
      WHERE estado = 1
      ORDER BY nombre ASC
    `);

    return {
      sucursales: sucursales.map((s) => ({
        id_sucursal: Number(s.id_sucursal),
        nombre: s.nombre,
      })),
      variantes: variantes.map((v) => ({
        id_variante: Number(v.id_variante),
        codigo_variante: v.codigo_variante,
        codigo_producto: v.codigo_producto,
        producto: v.producto,
      })),
      proveedores: proveedores.map((p) => ({
        id_proveedor: Number(p.id_proveedor),
        nombre: p.nombre,
      })),
    };
  }

  async listar() {
    const entradas: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        im.id_movimiento,
        im.fecha,
        s.nombre AS sucursal,
        p.nombre AS producto,
        pv.codigo_variante,
        im.cantidad,
        im.referencia,
        im.descripcion,
        u.usuario
      FROM inventario_movimientos im
      INNER JOIN tipos_movimiento_inventario tmi
        ON tmi.id_tipo_movimiento = im.id_tipo_movimiento
      INNER JOIN sucursales s ON s.id_sucursal = im.id_sucursal
      INNER JOIN producto_variantes pv ON pv.id_variante = im.id_variante
      INNER JOIN productos p ON p.id_producto = pv.id_producto
      INNER JOIN usuarios u ON u.id_usuario = im.id_usuario
      WHERE tmi.codigo = 'ENTRADA_COMPRA'
      ORDER BY im.fecha DESC, im.id_movimiento DESC
      LIMIT 200
    `);

    return entradas.map((e) => ({
      id_movimiento: Number(e.id_movimiento),
      fecha: e.fecha,
      sucursal: e.sucursal,
      producto: e.producto,
      codigo_variante: e.codigo_variante,
      cantidad: Number(e.cantidad),
      referencia: e.referencia,
      descripcion: e.descripcion,
      usuario: e.usuario,
    }));
  }

  async crear(data: CreateEntradaInventarioDto) {
    const idSucursal = Number(data.id_sucursal);
    const idVariante = Number(data.id_variante);
    const cantidad = Number(data.cantidad);
    const stockMinimo = Number(data.stock_minimo || 0);

    if (!idSucursal || !idVariante || cantidad <= 0) {
      throw new BadRequestException('Sucursal, producto y cantidad son obligatorios');
    }

    const tipo: any[] = await this.prisma.$queryRaw`
      SELECT id_tipo_movimiento, afecta_stock
      FROM tipos_movimiento_inventario
      WHERE codigo = 'ENTRADA_COMPRA'
        AND estado = 1
      LIMIT 1
    `;

    if (tipo.length === 0) {
      throw new BadRequestException('No existe el tipo ENTRADA_COMPRA');
    }

    const idTipoMovimiento = tipo[0].id_tipo_movimiento;

    return await this.prisma.$transaction(async (tx) => {
      const inventarioActual: any[] = await tx.$queryRaw`
        SELECT stock_actual
        FROM inventario_sucursal
        WHERE id_sucursal = ${idSucursal}
          AND id_variante = ${idVariante}
        LIMIT 1
      `;

      const stockActual =
        inventarioActual.length > 0
          ? Number(inventarioActual[0].stock_actual)
          : 0;

      const nuevoStock = stockActual + cantidad;

      await tx.$executeRaw`
        INSERT INTO inventario_sucursal (
          id_sucursal,
          id_variante,
          stock_actual,
          stock_reservado,
          stock_minimo
        ) VALUES (
          ${idSucursal},
          ${idVariante},
          ${nuevoStock},
          0,
          ${stockMinimo}
        )
        ON DUPLICATE KEY UPDATE
          stock_actual = ${nuevoStock},
          stock_minimo = IF(${stockMinimo} > 0, ${stockMinimo}, stock_minimo)
      `;

      await tx.$executeRaw`
        INSERT INTO inventario_movimientos (
          id_sucursal,
          id_variante,
          id_usuario,
          id_tipo_movimiento,
          cantidad,
          referencia,
          descripcion
        ) VALUES (
          ${idSucursal},
          ${idVariante},
          2,
          ${idTipoMovimiento},
          ${cantidad},
          ${data.referencia || null},
          ${data.descripcion || null}
        )
      `;

      return {
        mensaje: 'Entrada de inventario registrada correctamente',
        stock_anterior: stockActual,
        cantidad,
        nuevo_stock: nuevoStock,
      };
    });
  }
}