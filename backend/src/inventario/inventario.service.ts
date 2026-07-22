import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovimientoInventarioDto } from './dto/movimiento-inventario.dto';

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async catalogos() {
    const sucursales: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id_sucursal, codigo_sucursal, nombre
      FROM sucursales
      WHERE estado = 1
      ORDER BY nombre ASC
    `);

    const variantes: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        pv.id_variante,
        pv.codigo_variante,
        p.codigo_producto,
        p.nombre AS producto,
        c.nombre AS categoria,
        COALESCE(m.nombre, 'Sin marca') AS marca
      FROM producto_variantes pv
      INNER JOIN productos p ON p.id_producto = pv.id_producto
      INNER JOIN categorias c ON c.id_categoria = p.id_categoria
      LEFT JOIN marcas m ON m.id_marca = p.id_marca
      WHERE pv.estado = 1
        AND p.estado = 1
      ORDER BY p.nombre ASC
    `);

    return {
      sucursales: sucursales.map((s) => ({
        id_sucursal: Number(s.id_sucursal),
        codigo_sucursal: s.codigo_sucursal,
        nombre: s.nombre,
      })),
      variantes: variantes.map((v) => ({
        id_variante: Number(v.id_variante),
        codigo_variante: v.codigo_variante,
        codigo_producto: v.codigo_producto,
        producto: v.producto,
        categoria: v.categoria,
        marca: v.marca,
      })),
    };
  }

  async listar(idSucursal?: number, buscar?: string) {
    let sql = `
      SELECT
        inv.id_inventario,
        s.id_sucursal,
        s.nombre AS sucursal,
        pv.id_variante,
        pv.codigo_variante,
        p.codigo_producto,
        p.nombre AS producto,
        c.nombre AS categoria,
        COALESCE(m.nombre, 'Sin marca') AS marca,
        inv.stock_actual,
        inv.stock_reservado,
        inv.stock_minimo,
        (inv.stock_actual - inv.stock_reservado) AS stock_disponible
      FROM inventario_sucursal inv
      INNER JOIN sucursales s ON s.id_sucursal = inv.id_sucursal
      INNER JOIN producto_variantes pv ON pv.id_variante = inv.id_variante
      INNER JOIN productos p ON p.id_producto = pv.id_producto
      INNER JOIN categorias c ON c.id_categoria = p.id_categoria
      LEFT JOIN marcas m ON m.id_marca = p.id_marca
      WHERE 1 = 1
    `;

    const params: any[] = [];

    if (idSucursal) {
      sql += ` AND s.id_sucursal = ?`;
      params.push(idSucursal);
    }

    if (buscar && buscar.trim() !== '') {
      sql += `
        AND (
          p.nombre LIKE ?
          OR p.codigo_producto LIKE ?
          OR pv.codigo_variante LIKE ?
        )
      `;
      const filtro = `%${buscar.trim()}%`;
      params.push(filtro, filtro, filtro);
    }

    sql += ` ORDER BY p.nombre ASC`;

    const inventario: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);

    return inventario.map((i) => ({
      id_inventario: Number(i.id_inventario),
      id_sucursal: Number(i.id_sucursal),
      sucursal: i.sucursal,
      id_variante: Number(i.id_variante),
      codigo_variante: i.codigo_variante,
      codigo_producto: i.codigo_producto,
      producto: i.producto,
      categoria: i.categoria,
      marca: i.marca,
      stock_actual: Number(i.stock_actual),
      stock_reservado: Number(i.stock_reservado),
      stock_minimo: Number(i.stock_minimo),
      stock_disponible: Number(i.stock_disponible),
      estado_stock:
        Number(i.stock_disponible) <= Number(i.stock_minimo)
          ? 'BAJO'
          : 'NORMAL',
    }));
  }

  async obtener(id: number) {
    const datos: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT *
      FROM inventario_sucursal
      WHERE id_inventario = ?
      LIMIT 1
      `,
      id,
    );

    if (datos.length === 0) {
      throw new NotFoundException('Inventario no encontrado');
    }

    const i = datos[0];

    return {
      id_inventario: Number(i.id_inventario),
      id_sucursal: Number(i.id_sucursal),
      id_variante: Number(i.id_variante),
      stock_actual: Number(i.stock_actual),
      stock_reservado: Number(i.stock_reservado),
      stock_minimo: Number(i.stock_minimo),
    };
  }

  async kardex(idVariante?: number, idSucursal?: number) {
    let sql = `
      SELECT
        im.id_movimiento,
        im.fecha,
        s.nombre AS sucursal,
        p.codigo_producto,
        p.nombre AS producto,
        pv.codigo_variante,
        tmi.codigo AS tipo_codigo,
        tmi.nombre AS tipo_movimiento,
        tmi.afecta_stock,
        im.cantidad,
        im.referencia,
        im.descripcion,
        u.usuario
      FROM inventario_movimientos im
      INNER JOIN sucursales s ON s.id_sucursal = im.id_sucursal
      INNER JOIN producto_variantes pv ON pv.id_variante = im.id_variante
      INNER JOIN productos p ON p.id_producto = pv.id_producto
      INNER JOIN tipos_movimiento_inventario tmi
        ON tmi.id_tipo_movimiento = im.id_tipo_movimiento
      INNER JOIN usuarios u ON u.id_usuario = im.id_usuario
      WHERE 1 = 1
    `;

    const params: any[] = [];

    if (idVariante) {
      sql += ` AND im.id_variante = ?`;
      params.push(idVariante);
    }

    if (idSucursal) {
      sql += ` AND im.id_sucursal = ?`;
      params.push(idSucursal);
    }

    sql += ` ORDER BY im.fecha DESC, im.id_movimiento DESC LIMIT 200`;

    const datos: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);

    return datos.map((m) => ({
      id_movimiento: Number(m.id_movimiento),
      fecha: m.fecha,
      sucursal: m.sucursal,
      codigo_producto: m.codigo_producto,
      producto: m.producto,
      codigo_variante: m.codigo_variante,
      tipo_codigo: m.tipo_codigo,
      tipo_movimiento: m.tipo_movimiento,
      afecta_stock: Number(m.afecta_stock),
      cantidad: Number(m.cantidad),
      referencia: m.referencia,
      descripcion: m.descripcion,
      usuario: m.usuario,
    }));
  }

  async movimiento(data: MovimientoInventarioDto, codigoMovimiento: string) {
    const idSucursal = Number(data.id_sucursal);
    const idVariante = Number(data.id_variante);
    const cantidad = Number(data.cantidad);
    const stockMinimo = Number(data.stock_minimo || 0);

    if (!idSucursal || !idVariante || cantidad <= 0) {
      throw new BadRequestException(
        'Sucursal, variante y cantidad son obligatorios',
      );
    }

    const tipo: any[] = await this.prisma.$queryRaw`
      SELECT id_tipo_movimiento, afecta_stock
      FROM tipos_movimiento_inventario
      WHERE codigo = ${codigoMovimiento}
        AND estado = 1
      LIMIT 1
    `;

    if (tipo.length === 0) {
      throw new BadRequestException('Tipo de movimiento no existe');
    }

    const idTipoMovimiento = tipo[0].id_tipo_movimiento;
    const afectaStock = Number(tipo[0].afecta_stock);

    const variante: any[] = await this.prisma.$queryRaw`
      SELECT id_variante
      FROM producto_variantes
      WHERE id_variante = ${idVariante}
        AND estado = 1
      LIMIT 1
    `;

    if (variante.length === 0) {
      throw new BadRequestException('La variante no existe');
    }

    const sucursal: any[] = await this.prisma.$queryRaw`
      SELECT id_sucursal
      FROM sucursales
      WHERE id_sucursal = ${idSucursal}
        AND estado = 1
      LIMIT 1
    `;

    if (sucursal.length === 0) {
      throw new BadRequestException('La sucursal no existe');
    }

    return await this.prisma.$transaction(async (tx) => {
      const inventarioActual: any[] = await tx.$queryRaw`
        SELECT id_inventario, stock_actual
        FROM inventario_sucursal
        WHERE id_sucursal = ${idSucursal}
          AND id_variante = ${idVariante}
        LIMIT 1
      `;

      const stockActual =
        inventarioActual.length > 0
          ? Number(inventarioActual[0].stock_actual)
          : 0;

      const nuevoStock = stockActual + cantidad * afectaStock;

      if (nuevoStock < 0) {
        throw new BadRequestException(
          'No hay suficiente stock para realizar este movimiento',
        );
      }

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
        mensaje: 'Movimiento de inventario registrado correctamente',
        stock_anterior: stockActual,
        cantidad,
        nuevo_stock: nuevoStock,
        tipo_movimiento: codigoMovimiento,
      };
    });
  }
}