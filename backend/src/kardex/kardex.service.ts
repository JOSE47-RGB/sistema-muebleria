import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type FiltrosKardex = {
  idSucursal?: number;
  idVariante?: number;
  idTipoMovimiento?: number;
  fechaInicio?: string;
  fechaFin?: string;
};

@Injectable()
export class KardexService {
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
        p.nombre AS producto
      FROM producto_variantes pv
      INNER JOIN productos p ON p.id_producto = pv.id_producto
      WHERE pv.estado = 1
        AND p.estado = 1
      ORDER BY p.nombre ASC
    `);

    const tipos: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT id_tipo_movimiento, codigo, nombre
      FROM tipos_movimiento_inventario
      WHERE estado = 1
      ORDER BY id_tipo_movimiento ASC
    `);

    return {
      sucursales: sucursales.map((s) => ({
        id_sucursal: Number(s.id_sucursal),
        nombre: s.nombre,
      })),
      variantes: variantes.map((v) => ({
        id_variante: Number(v.id_variante),
        codigo_variante: v.codigo_variante,
        producto: v.producto,
      })),
      tipos: tipos.map((t) => ({
        id_tipo_movimiento: Number(t.id_tipo_movimiento),
        codigo: t.codigo,
        nombre: t.nombre,
      })),
    };
  }

  async listar(filtros: FiltrosKardex) {
    let sql = `
      SELECT
        id_movimiento,
        fecha,
        id_sucursal,
        sucursal,
        id_variante,
        codigo_variante,
        id_producto,
        codigo_producto,
        producto,
        id_tipo_movimiento,
        codigo_movimiento,
        tipo_movimiento,
        afecta_stock,
        cantidad,
        cantidad_con_signo,
        referencia,
        descripcion,
        id_usuario,
        usuario
      FROM vw_kardex_inventario
      WHERE 1 = 1
    `;

    const params: any[] = [];

    if (filtros.idSucursal) {
      sql += ` AND id_sucursal = ?`;
      params.push(filtros.idSucursal);
    }

    if (filtros.idVariante) {
      sql += ` AND id_variante = ?`;
      params.push(filtros.idVariante);
    }

    if (filtros.idTipoMovimiento) {
      sql += ` AND id_tipo_movimiento = ?`;
      params.push(filtros.idTipoMovimiento);
    }

    if (filtros.fechaInicio) {
      sql += ` AND DATE(fecha) >= ?`;
      params.push(filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
      sql += ` AND DATE(fecha) <= ?`;
      params.push(filtros.fechaFin);
    }

    sql += ` ORDER BY fecha DESC, id_movimiento DESC LIMIT 500`;

    const datos: any[] = await this.prisma.$queryRawUnsafe(sql, ...params);

    return datos.map((k) => ({
      id_movimiento: Number(k.id_movimiento),
      fecha: k.fecha,
      id_sucursal: Number(k.id_sucursal),
      sucursal: k.sucursal,
      id_variante: Number(k.id_variante),
      codigo_variante: k.codigo_variante,
      id_producto: Number(k.id_producto),
      codigo_producto: k.codigo_producto,
      producto: k.producto,
      id_tipo_movimiento: Number(k.id_tipo_movimiento),
      codigo_movimiento: k.codigo_movimiento,
      tipo_movimiento: k.tipo_movimiento,
      afecta_stock: Number(k.afecta_stock),
      cantidad: Number(k.cantidad),
      cantidad_con_signo: Number(k.cantidad_con_signo),
      referencia: k.referencia,
      descripcion: k.descripcion,
      id_usuario: Number(k.id_usuario),
      usuario: k.usuario,
    }));
  }
}