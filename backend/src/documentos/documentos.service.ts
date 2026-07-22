import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type UsuarioSucursalDb = {
  id_usuario: bigint;
  id_sucursal: bigint;
};

@Injectable()
export class DocumentosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private validarId(
    id: number,
    mensaje = 'Identificador inválido',
  ) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(mensaje);
    }
  }

  private async obtenerSucursalUsuario(
    idUsuario: number,
  ) {
    this.validarId(
      idUsuario,
      'Identificador de usuario inválido',
    );

    const usuarios: UsuarioSucursalDb[] =
      await this.prisma.$queryRaw`
        SELECT
          u.id_usuario,
          e.id_sucursal
        FROM usuarios u
        INNER JOIN empleados e
          ON e.id_empleado = u.id_empleado
        INNER JOIN sucursales s
          ON s.id_sucursal = e.id_sucursal
        WHERE u.id_usuario = ${idUsuario}
          AND u.estado = 1
          AND e.estado = 1
          AND s.estado = 1
        LIMIT 1
      `;

    if (usuarios.length === 0) {
      throw new BadRequestException(
        'El usuario no tiene una sucursal activa asignada',
      );
    }

    return {
      id_usuario: Number(usuarios[0].id_usuario),
      id_sucursal: Number(
        usuarios[0].id_sucursal,
      ),
    };
  }

  async listar(
    idUsuario: number,
    buscar?: string,
  ) {
    const usuario =
      await this.obtenerSucursalUsuario(idUsuario);

    let sql = `
      SELECT
        d.id_documento,
        d.codigo_documento,
        d.origen,
        d.id_origen,
        d.fecha,
        d.subtotal,
        d.descuento,
        d.total,
        d.observaciones,
        td.codigo AS codigo_tipo,
        td.nombre AS tipo_documento,
        es.codigo AS codigo_estado,
        es.nombre AS estado,
        COALESCE(
          TRIM(
            CONCAT(
              c.nombres,
              ' ',
              COALESCE(c.apellidos, '')
            )
          ),
          'Consumidor final'
        ) AS cliente,
        c.nit,
        u.usuario,
        s.nombre AS sucursal
      FROM documentos d
      INNER JOIN tipos_documento td
        ON td.id_tipo_documento =
           d.id_tipo_documento
      INNER JOIN estados_sistema es
        ON es.id_estado = d.id_estado
      INNER JOIN usuarios u
        ON u.id_usuario = d.id_usuario
      INNER JOIN sucursales s
        ON s.id_sucursal = d.id_sucursal
      LEFT JOIN clientes c
        ON c.id_cliente = d.id_cliente
      WHERE d.id_sucursal = ?
    `;

    const parametros: unknown[] = [
      usuario.id_sucursal,
    ];

    if (buscar?.trim()) {
      const texto = `%${buscar.trim()}%`;

      sql += `
        AND (
          d.codigo_documento LIKE ?
          OR c.nombres LIKE ?
          OR c.apellidos LIKE ?
          OR c.nit LIKE ?
        )
      `;

      parametros.push(
        texto,
        texto,
        texto,
        texto,
      );
    }

    sql += `
      ORDER BY d.fecha DESC, d.id_documento DESC
      LIMIT 300
    `;

    const documentos: any[] =
      await this.prisma.$queryRawUnsafe(
        sql,
        ...parametros,
      );

    return documentos.map((documento) => ({
      id_documento: Number(
        documento.id_documento,
      ),
      codigo_documento:
        documento.codigo_documento,
      origen: documento.origen,
      id_origen: Number(documento.id_origen),
      fecha: documento.fecha,
      subtotal: Number(documento.subtotal),
      descuento: Number(documento.descuento),
      total: Number(documento.total),
      observaciones: documento.observaciones,
      codigo_tipo: documento.codigo_tipo,
      tipo_documento:
        documento.tipo_documento,
      codigo_estado:
        documento.codigo_estado,
      estado: documento.estado,
      cliente: documento.cliente,
      nit: documento.nit,
      usuario: documento.usuario,
      sucursal: documento.sucursal,
    }));
  }

  async obtenerPorVenta(
    idVenta: number,
    idUsuario: number,
  ) {
    this.validarId(
      idVenta,
      'Identificador de venta inválido',
    );

    const usuario =
      await this.obtenerSucursalUsuario(idUsuario);

    const ventas: any[] =
      await this.prisma.$queryRaw`
        SELECT
          id_venta
        FROM ventas
        WHERE id_venta = ${idVenta}
          AND id_sucursal =
              ${usuario.id_sucursal}
        LIMIT 1
      `;

    if (ventas.length === 0) {
      throw new NotFoundException(
        'Venta no encontrada',
      );
    }

    const idDocumento =
      await this.generarReciboVenta(
        idVenta,
        usuario.id_sucursal,
      );

    return this.obtener(
      idDocumento,
      idUsuario,
    );
  }

  private async generarReciboVenta(
    idVenta: number,
    idSucursal: number,
  ): Promise<number> {
    const existentes: any[] =
      await this.prisma.$queryRaw`
        SELECT d.id_documento
        FROM documentos d
        INNER JOIN tipos_documento td
          ON td.id_tipo_documento =
             d.id_tipo_documento
        WHERE d.origen = 'VENTA'
          AND d.id_origen = ${idVenta}
          AND d.id_sucursal = ${idSucursal}
          AND td.codigo = 'RECIBO'
        LIMIT 1
      `;

    if (existentes.length > 0) {
      return Number(
        existentes[0].id_documento,
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          /*
           * Se vuelve a comprobar dentro de la
           * transacción para evitar duplicados.
           */
          const documentoExistente: any[] =
            await tx.$queryRaw`
              SELECT d.id_documento
              FROM documentos d
              INNER JOIN tipos_documento td
                ON td.id_tipo_documento =
                   d.id_tipo_documento
              WHERE d.origen = 'VENTA'
                AND d.id_origen = ${idVenta}
                AND d.id_sucursal = ${idSucursal}
                AND td.codigo = 'RECIBO'
              LIMIT 1
            `;

          if (documentoExistente.length > 0) {
            return Number(
              documentoExistente[0]
                .id_documento,
            );
          }

          const ventas: any[] =
            await tx.$queryRaw`
              SELECT
                v.id_venta,
                v.codigo_venta,
                v.id_cliente,
                v.id_usuario,
                v.id_sucursal,
                v.subtotal,
                v.descuento,
                v.total
              FROM ventas v
              WHERE v.id_venta = ${idVenta}
                AND v.id_sucursal = ${idSucursal}
              LIMIT 1
            `;

          if (ventas.length === 0) {
            throw new NotFoundException(
              'Venta no encontrada',
            );
          }

          const venta = ventas[0];

          const tipos: any[] =
            await tx.$queryRaw`
              SELECT
                id_tipo_documento,
                prefijo
              FROM tipos_documento
              WHERE codigo = 'RECIBO'
                AND estado = 1
              LIMIT 1
            `;

          if (tipos.length === 0) {
            throw new BadRequestException(
              'No existe el tipo de documento RECIBO',
            );
          }

          const idTipoDocumento = Number(
            tipos[0].id_tipo_documento,
          );

          const prefijo =
            tipos[0].prefijo || 'REC';

          const estados: any[] =
            await tx.$queryRaw`
              SELECT id_estado
              FROM estados_sistema
              WHERE modulo = 'GENERAL'
                AND codigo = 'ACTIVO'
                AND estado = 1
              LIMIT 1
            `;

          if (estados.length === 0) {
            throw new BadRequestException(
              'No existe el estado GENERAL/ACTIVO',
            );
          }

          const idEstado = Number(
            estados[0].id_estado,
          );

          await tx.$executeRaw`
            INSERT IGNORE INTO secuencias_documentos (
              id_sucursal,
              id_tipo_documento,
              serie,
              correlativo_actual,
              estado
            ) VALUES (
              ${idSucursal},
              ${idTipoDocumento},
              'A',
              0,
              1
            )
          `;

          const secuencias: any[] =
            await tx.$queryRaw`
              SELECT
                id_secuencia,
                serie,
                correlativo_actual
              FROM secuencias_documentos
              WHERE id_sucursal = ${idSucursal}
                AND id_tipo_documento =
                    ${idTipoDocumento}
                AND serie = 'A'
                AND estado = 1
              LIMIT 1
              FOR UPDATE
            `;

          if (secuencias.length === 0) {
            throw new BadRequestException(
              'No existe una secuencia activa para recibos',
            );
          }

          const idSecuencia = Number(
            secuencias[0].id_secuencia,
          );

          const serie =
            secuencias[0].serie;

          const correlativo =
            Number(
              secuencias[0]
                .correlativo_actual,
            ) + 1;

          await tx.$executeRaw`
            UPDATE secuencias_documentos
            SET correlativo_actual =
                ${correlativo}
            WHERE id_secuencia =
                  ${idSecuencia}
          `;

          const codigoDocumento =
            `${prefijo}-${serie}-${String(
              correlativo,
            ).padStart(6, '0')}`;

          await tx.$executeRaw`
            INSERT INTO documentos (
              codigo_documento,
              id_tipo_documento,
              origen,
              id_origen,
              id_cliente,
              id_usuario,
              id_sucursal,
              id_estado,
              fecha,
              subtotal,
              descuento,
              total,
              observaciones
            ) VALUES (
              ${codigoDocumento},
              ${idTipoDocumento},
              'VENTA',
              ${idVenta},
              ${venta.id_cliente},
              ${venta.id_usuario},
              ${venta.id_sucursal},
              ${idEstado},
              NOW(),
              ${venta.subtotal},
              ${venta.descuento},
              ${venta.total},
              ${`Recibo de la venta ${venta.codigo_venta}`}
            )
          `;

          const resultadoId: any[] =
            await tx.$queryRaw`
              SELECT LAST_INSERT_ID()
                     AS id_documento
            `;

          const idDocumento = Number(
            resultadoId[0]?.id_documento,
          );

          if (
            !Number.isInteger(idDocumento) ||
            idDocumento <= 0
          ) {
            throw new BadRequestException(
              'No fue posible generar el recibo',
            );
          }

          await tx.$executeRaw`
            INSERT INTO documento_detalle (
              id_documento,
              codigo_item,
              descripcion,
              cantidad,
              precio_unitario,
              descuento,
              subtotal
            )
            SELECT
              ${idDocumento},
              pv.codigo_variante,
              CONCAT(
                p.nombre,
                CASE
                  WHEN pv.color IS NOT NULL
                       AND pv.color <> ''
                  THEN CONCAT(
                    ' - ',
                    pv.color
                  )
                  ELSE ''
                END,
                CASE
                  WHEN pv.medida IS NOT NULL
                       AND pv.medida <> ''
                  THEN CONCAT(
                    ' - ',
                    pv.medida
                  )
                  ELSE ''
                END
              ),
              vd.cantidad,
              vd.precio_unitario,
              vd.descuento,
              vd.subtotal
            FROM venta_detalle vd
            INNER JOIN producto_variantes pv
              ON pv.id_variante =
                 vd.id_variante
            INNER JOIN productos p
              ON p.id_producto =
                 pv.id_producto
            WHERE vd.id_venta = ${idVenta}
          `;

          await tx.$executeRaw`
            INSERT INTO documento_pagos (
              id_documento,
              id_metodo_pago,
              monto,
              referencia
            )
            SELECT
              ${idDocumento},
              pg.id_metodo_pago,
              pg.monto,
              pg.referencia
            FROM pagos pg
            WHERE pg.id_venta = ${idVenta}
          `;

          return idDocumento;
        },
      );
    } catch (error: any) {
      /*
       * Puede producirse una carrera:
       * otra petición generó el recibo antes.
       */
      const existente: any[] =
        await this.prisma.$queryRaw`
          SELECT d.id_documento
          FROM documentos d
          INNER JOIN tipos_documento td
            ON td.id_tipo_documento =
               d.id_tipo_documento
          WHERE d.origen = 'VENTA'
            AND d.id_origen = ${idVenta}
            AND d.id_sucursal = ${idSucursal}
            AND td.codigo = 'RECIBO'
          LIMIT 1
        `;

      if (existente.length > 0) {
        return Number(
          existente[0].id_documento,
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error(
        'Error al generar recibo:',
        error,
      );

      throw new BadRequestException(
        'La venta existe, pero no fue posible generar el recibo',
      );
    }
  }

  async obtener(
    idDocumento: number,
    idUsuario: number,
  ) {
    this.validarId(
      idDocumento,
      'Identificador de documento inválido',
    );

    const usuario =
      await this.obtenerSucursalUsuario(idUsuario);

    const documentos: any[] =
      await this.prisma.$queryRaw`
        SELECT
          d.id_documento,
          d.codigo_documento,
          d.origen,
          d.id_origen,
          d.fecha,
          d.subtotal,
          d.descuento,
          d.total,
          d.observaciones,
          td.codigo AS codigo_tipo,
          td.nombre AS tipo_documento,
          es.codigo AS codigo_estado,
          es.nombre AS estado,
          v.codigo_venta,
          COALESCE(
            TRIM(
              CONCAT(
                c.nombres,
                ' ',
                COALESCE(c.apellidos, '')
              )
            ),
            'Consumidor final'
          ) AS cliente,
          c.nit,
          c.telefono,
          c.direccion,
          u.usuario AS vendedor,
          s.codigo_sucursal,
          s.nombre AS sucursal,
          s.telefono AS telefono_sucursal,
          s.direccion AS direccion_sucursal
        FROM documentos d
        INNER JOIN tipos_documento td
          ON td.id_tipo_documento =
             d.id_tipo_documento
        INNER JOIN estados_sistema es
          ON es.id_estado = d.id_estado
        INNER JOIN usuarios u
          ON u.id_usuario = d.id_usuario
        INNER JOIN sucursales s
          ON s.id_sucursal = d.id_sucursal
        LEFT JOIN clientes c
          ON c.id_cliente = d.id_cliente
        LEFT JOIN ventas v
          ON d.origen = 'VENTA'
         AND v.id_venta = d.id_origen
        WHERE d.id_documento =
              ${idDocumento}
          AND d.id_sucursal =
              ${usuario.id_sucursal}
        LIMIT 1
      `;

    if (documentos.length === 0) {
      throw new NotFoundException(
        'Documento no encontrado',
      );
    }

    const detalles: any[] =
      await this.prisma.$queryRaw`
        SELECT
          id_documento_detalle,
          codigo_item,
          descripcion,
          cantidad,
          precio_unitario,
          descuento,
          subtotal
        FROM documento_detalle
        WHERE id_documento = ${idDocumento}
        ORDER BY id_documento_detalle
      `;

    const pagos: any[] =
      await this.prisma.$queryRaw`
        SELECT
          dp.id_documento_pago,
          dp.id_metodo_pago,
          mp.codigo AS codigo_metodo,
          mp.nombre AS metodo_pago,
          dp.monto,
          dp.referencia
        FROM documento_pagos dp
        INNER JOIN metodos_pago mp
          ON mp.id_metodo_pago =
             dp.id_metodo_pago
        WHERE dp.id_documento =
              ${idDocumento}
        ORDER BY dp.id_documento_pago
      `;

    const documento = documentos[0];

    return {
      id_documento: Number(
        documento.id_documento,
      ),
      codigo_documento:
        documento.codigo_documento,
      tipo_documento:
        documento.tipo_documento,
      codigo_tipo: documento.codigo_tipo,
      origen: documento.origen,
      id_origen: Number(documento.id_origen),
      codigo_venta: documento.codigo_venta,
      fecha: documento.fecha,
      subtotal: Number(documento.subtotal),
      descuento: Number(documento.descuento),
      total: Number(documento.total),
      observaciones: documento.observaciones,
      codigo_estado:
        documento.codigo_estado,
      estado: documento.estado,

      cliente: {
        nombre: documento.cliente,
        nit: documento.nit,
        telefono: documento.telefono,
        direccion: documento.direccion,
      },

      vendedor: documento.vendedor,

      sucursal: {
        codigo: documento.codigo_sucursal,
        nombre: documento.sucursal,
        telefono:
          documento.telefono_sucursal,
        direccion:
          documento.direccion_sucursal,
      },

      detalles: detalles.map((detalle) => ({
        id_documento_detalle: Number(
          detalle.id_documento_detalle,
        ),
        codigo_item: detalle.codigo_item,
        descripcion: detalle.descripcion,
        cantidad: Number(detalle.cantidad),
        precio_unitario: Number(
          detalle.precio_unitario,
        ),
        descuento: Number(
          detalle.descuento,
        ),
        subtotal: Number(detalle.subtotal),
      })),

      pagos: pagos.map((pago) => ({
        id_documento_pago: Number(
          pago.id_documento_pago,
        ),
        id_metodo_pago: Number(
          pago.id_metodo_pago,
        ),
        codigo_metodo:
          pago.codigo_metodo,
        metodo_pago: pago.metodo_pago,
        monto: Number(pago.monto),
        referencia: pago.referencia,
      })),
    };
  }

  async registrarImpresion(
    idDocumento: number,
    idUsuario: number,
  ) {
    await this.obtener(
      idDocumento,
      idUsuario,
    );

    /*
     * La auditoría no afecta la impresión si
     * en el futuro cambias su estructura.
     */
    try {
      await this.prisma.$executeRaw`
        INSERT INTO auditoria_documentos (
          id_documento,
          id_usuario,
          accion,
          motivo,
          fecha
        ) VALUES (
          ${idDocumento},
          ${idUsuario},
          'IMPRIMIR',
          'Impresión desde el POS',
          NOW()
        )
      `;
    } catch (error) {
      console.error(
        'No se pudo auditar la impresión:',
        error,
      );
    }

    return {
      mensaje: 'Impresión registrada',
      id_documento: idDocumento,
    };
  }
}