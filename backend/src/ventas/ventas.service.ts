import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';

type FiltrosVentas = {
  fechaInicio?: string;
  fechaFin?: string;
  buscar?: string;
};

type DatosUsuarioDb = {
  id_usuario: bigint;
  id_sucursal: bigint;
  sucursal: string;
};

type TurnoDb = {
  id_turno: bigint;
  id_caja: bigint;
  codigo_caja: string;
  caja: string;
};

type VentaDb = {
  id_venta: bigint;
  codigo_venta: string;
  token_operacion: string | null;
  total: unknown;
};

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async obtenerDatosUsuario(
    idUsuario: number,
  ) {
    const usuarios: DatosUsuarioDb[] =
      await this.prisma.$queryRaw`
        SELECT
          u.id_usuario,
          e.id_sucursal,
          s.nombre AS sucursal
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
      id_sucursal: Number(usuarios[0].id_sucursal),
      sucursal: usuarios[0].sucursal,
    };
  }

  private async obtenerTurnoActivo(
  idUsuario: number,
) {
  const turnos: any[] =
    await this.prisma.$queryRaw`
      SELECT
        ct.id_turno,
        ct.id_caja,
        ct.fecha_apertura,
        ct.monto_inicial,
        ct.monto_esperado,

        c.codigo_caja,
        c.nombre AS caja,

        c.id_sucursal,
        s.nombre AS sucursal

      FROM caja_turnos ct

      INNER JOIN cajas c
        ON c.id_caja = ct.id_caja

      INNER JOIN estados_sistema ec
        ON ec.id_estado = ct.id_estado

      INNER JOIN usuarios u
        ON u.id_usuario = ct.id_usuario

      INNER JOIN empleados e
        ON e.id_empleado = u.id_empleado

      INNER JOIN sucursales s
        ON s.id_sucursal = c.id_sucursal

      WHERE ct.id_usuario = ${idUsuario}
        AND ct.fecha_cierre IS NULL

        AND ec.modulo = 'CAJA'
        AND ec.codigo = 'ABIERTA'
        AND ec.estado = 1

        AND c.id_sucursal = e.id_sucursal

        AND c.estado = 1
        AND s.estado = 1
        AND u.estado = 1
        AND e.estado = 1

      ORDER BY
        ct.fecha_apertura DESC,
        ct.id_turno DESC

      LIMIT 1
    `;

  if (turnos.length === 0) {
    return null;
  }

  const turno = turnos[0];

  return {
    id_turno: Number(turno.id_turno),
    id_caja: Number(turno.id_caja),
    codigo_caja: turno.codigo_caja,
    caja: turno.caja,
    id_sucursal: Number(
      turno.id_sucursal,
    ),
    sucursal: turno.sucursal,
    fecha_apertura:
      turno.fecha_apertura,
    monto_inicial: Number(
      turno.monto_inicial,
    ),
    monto_esperado: Number(
      turno.monto_esperado,
    ),
  };
}


  private async buscarVentaPorToken(
    tokenOperacion: string,
    montoPagado: number,
  ) {
    const ventas: VentaDb[] =
      await this.prisma.$queryRaw`
        SELECT
          id_venta,
          codigo_venta,
          token_operacion,
          total
        FROM ventas
        WHERE token_operacion = ${tokenOperacion}
        LIMIT 1
      `;

    if (ventas.length === 0) {
      return null;
    }

    const total = Number(ventas[0].total);

    return {
      id_venta: Number(ventas[0].id_venta),
      codigo_venta: ventas[0].codigo_venta,
      total,
      cambio: Math.max(
        Number((montoPagado - total).toFixed(2)),
        0,
      ),
      ya_registrada: true,
    };
  }

  async catalogos(idUsuario: number) {
    const usuario =
      await this.obtenerDatosUsuario(idUsuario);

    const turno =
  await this.obtenerTurnoActivo(
    idUsuario,
  );

    const productos: any[] =
      await this.prisma.$queryRaw`
        SELECT
          pv.id_variante,
          p.id_producto,
          p.codigo_producto,
          p.nombre AS producto,
          pv.codigo_variante,
          pv.color,
          pv.material,
          pv.medida,
          pv.precio_venta,
          COALESCE(m.nombre, 'Sin marca') AS marca,
          c.nombre AS categoria,
          i.stock_actual,
          i.stock_reservado,
          (
            i.stock_actual -
            i.stock_reservado
          ) AS stock_disponible
        FROM inventario_sucursal i
        INNER JOIN producto_variantes pv
          ON pv.id_variante = i.id_variante
        INNER JOIN productos p
          ON p.id_producto = pv.id_producto
        INNER JOIN categorias c
          ON c.id_categoria = p.id_categoria
        LEFT JOIN marcas m
          ON m.id_marca = p.id_marca
        WHERE i.id_sucursal =
              ${usuario.id_sucursal}
          AND p.estado = 1
          AND pv.estado = 1
          AND (
            i.stock_actual -
            i.stock_reservado
          ) > 0
        ORDER BY p.nombre, pv.codigo_variante
      `;

    const metodosPago: any[] =
      await this.prisma.$queryRaw`
        SELECT
          id_metodo_pago,
          codigo,
          nombre,
          requiere_referencia
        FROM metodos_pago
        WHERE estado = 1
        ORDER BY id_metodo_pago
      `;

    return {
      sucursal: {
        id_sucursal: usuario.id_sucursal,
        nombre: usuario.sucursal,
      },

      turno,

      productos: productos.map((producto) => ({
        id_variante: Number(producto.id_variante),
        id_producto: Number(producto.id_producto),
        codigo_producto: producto.codigo_producto,
        producto: producto.producto,
        codigo_variante: producto.codigo_variante,
        color: producto.color,
        material: producto.material,
        medida: producto.medida,
        precio_venta: Number(producto.precio_venta),
        marca: producto.marca,
        categoria: producto.categoria,
        stock_actual: Number(producto.stock_actual),
        stock_reservado: Number(
          producto.stock_reservado,
        ),
        stock_disponible: Number(
          producto.stock_disponible,
        ),
      })),

      metodos_pago: metodosPago.map((metodo) => ({
        id_metodo_pago: Number(
          metodo.id_metodo_pago,
        ),
        codigo: metodo.codigo,
        nombre: metodo.nombre,
        requiere_referencia: Number(
          metodo.requiere_referencia,
        ),
      })),

      resumen_inventario: {
        productos_disponibles: productos.length,
        mensaje:
          productos.length === 0
            ? 'No existen productos con stock disponible en esta sucursal'
            : null,
      },
    };
  }

  async listar(
    idUsuario: number,
    filtros: FiltrosVentas,
  ) {
    const usuario =
      await this.obtenerDatosUsuario(idUsuario);

    let sql = `
      SELECT
        v.id_venta,
        v.codigo_venta,
        v.fecha,
        v.subtotal,
        v.descuento,
        v.total,
        v.observaciones,
        es.codigo AS codigo_estado,
        es.nombre AS estado,
        COALESCE(
          TRIM(
            CONCAT(
              cl.nombres,
              ' ',
              COALESCE(cl.apellidos, '')
            )
          ),
          'Consumidor final'
        ) AS cliente,
        u.usuario,
        s.nombre AS sucursal
      FROM ventas v
      INNER JOIN estados_sistema es
        ON es.id_estado = v.id_estado
      INNER JOIN usuarios u
        ON u.id_usuario = v.id_usuario
      INNER JOIN sucursales s
        ON s.id_sucursal = v.id_sucursal
      LEFT JOIN clientes cl
        ON cl.id_cliente = v.id_cliente
      WHERE v.id_sucursal = ?
    `;

    const parametros: unknown[] = [
      usuario.id_sucursal,
    ];

    if (filtros.fechaInicio) {
      sql += ` AND DATE(v.fecha) >= ?`;
      parametros.push(filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
      sql += ` AND DATE(v.fecha) <= ?`;
      parametros.push(filtros.fechaFin);
    }

    if (filtros.buscar?.trim()) {
      const buscar =
        `%${filtros.buscar.trim()}%`;

      sql += `
        AND (
          v.codigo_venta LIKE ?
          OR cl.nombres LIKE ?
          OR cl.apellidos LIKE ?
          OR cl.nit LIKE ?
        )
      `;

      parametros.push(
        buscar,
        buscar,
        buscar,
        buscar,
      );
    }

    sql += `
      ORDER BY v.fecha DESC, v.id_venta DESC
      LIMIT 300
    `;

    const ventas: any[] =
      await this.prisma.$queryRawUnsafe(
        sql,
        ...parametros,
      );

    return ventas.map((venta) => ({
      id_venta: Number(venta.id_venta),
      codigo_venta: venta.codigo_venta,
      fecha: venta.fecha,
      subtotal: Number(venta.subtotal),
      descuento: Number(venta.descuento),
      total: Number(venta.total),
      observaciones: venta.observaciones,
      codigo_estado: venta.codigo_estado,
      estado: venta.estado,
      cliente: venta.cliente,
      usuario: venta.usuario,
      sucursal: venta.sucursal,
    }));
  }

  async obtener(
    idVenta: number,
    idUsuario: number,
  ) {
    if (
      !Number.isInteger(idVenta) ||
      idVenta <= 0
    ) {
      throw new BadRequestException(
        'Identificador de venta inválido',
      );
    }

    const usuario =
      await this.obtenerDatosUsuario(idUsuario);

    const ventas: any[] =
      await this.prisma.$queryRaw`
        SELECT
          v.id_venta,
          v.codigo_venta,
          v.fecha,
          v.subtotal,
          v.descuento,
          v.total,
          v.observaciones,
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
        FROM ventas v
        INNER JOIN estados_sistema es
          ON es.id_estado = v.id_estado
        INNER JOIN usuarios u
          ON u.id_usuario = v.id_usuario
        INNER JOIN sucursales s
          ON s.id_sucursal = v.id_sucursal
        LEFT JOIN clientes c
          ON c.id_cliente = v.id_cliente
        WHERE v.id_venta = ${idVenta}
          AND v.id_sucursal =
              ${usuario.id_sucursal}
        LIMIT 1
      `;

    if (ventas.length === 0) {
      throw new NotFoundException(
        'Venta no encontrada',
      );
    }

    const detalles: any[] =
      await this.prisma.$queryRaw`
        SELECT
          vd.id_venta_detalle,
          vd.id_variante,
          p.codigo_producto,
          p.nombre AS producto,
          pv.codigo_variante,
          vd.cantidad,
          vd.precio_unitario,
          vd.descuento,
          vd.subtotal
        FROM venta_detalle vd
        INNER JOIN producto_variantes pv
          ON pv.id_variante = vd.id_variante
        INNER JOIN productos p
          ON p.id_producto = pv.id_producto
        WHERE vd.id_venta = ${idVenta}
        ORDER BY vd.id_venta_detalle
      `;

    const pagos: any[] =
      await this.prisma.$queryRaw`
        SELECT
          pg.id_pago,
          mp.codigo,
          mp.nombre AS metodo_pago,
          pg.monto,
          pg.referencia,
          pg.fecha
        FROM pagos pg
        INNER JOIN metodos_pago mp
          ON mp.id_metodo_pago =
             pg.id_metodo_pago
        WHERE pg.id_venta = ${idVenta}
        ORDER BY pg.fecha
      `;

    const venta = ventas[0];

    return {
      id_venta: Number(venta.id_venta),
      codigo_venta: venta.codigo_venta,
      fecha: venta.fecha,
      subtotal: Number(venta.subtotal),
      descuento: Number(venta.descuento),
      total: Number(venta.total),
      observaciones: venta.observaciones,
      codigo_estado: venta.codigo_estado,
      estado: venta.estado,
      cliente: venta.cliente,
      nit: venta.nit,
      usuario: venta.usuario,
      sucursal: venta.sucursal,

      detalles: detalles.map((detalle) => ({
        id_venta_detalle: Number(
          detalle.id_venta_detalle,
        ),
        id_variante: Number(detalle.id_variante),
        codigo_producto: detalle.codigo_producto,
        producto: detalle.producto,
        codigo_variante: detalle.codigo_variante,
        cantidad: Number(detalle.cantidad),
        precio_unitario: Number(
          detalle.precio_unitario,
        ),
        descuento: Number(detalle.descuento),
        subtotal: Number(detalle.subtotal),
      })),

      pagos: pagos.map((pago) => ({
        id_pago: Number(pago.id_pago),
        codigo_metodo: pago.codigo,
        metodo_pago: pago.metodo_pago,
        monto: Number(pago.monto),
        referencia: pago.referencia,
        fecha: pago.fecha,
      })),
    };
  }

  async crear(
    data: CreateVentaDto,
    idUsuario: number,
  ) {
    const tokenOperacion =
      data.token_operacion?.trim();

    const idCliente = Number(data.id_cliente);
    const idMetodoPago = Number(
      data.id_metodo_pago,
    );
    const montoPagado = Number(
      data.monto_pagado,
    );

    if (
      !tokenOperacion ||
      tokenOperacion.length !== 36
    ) {
      throw new BadRequestException(
        'El token de la operación es inválido',
      );
    }

    if (
      !Number.isInteger(idCliente) ||
      idCliente <= 0
    ) {
      throw new BadRequestException(
        'Debes seleccionar un cliente',
      );
    }

    if (
      !Number.isInteger(idMetodoPago) ||
      idMetodoPago <= 0
    ) {
      throw new BadRequestException(
        'Debes seleccionar un método de pago',
      );
    }

    if (
      !Number.isFinite(montoPagado) ||
      montoPagado <= 0
    ) {
      throw new BadRequestException(
        'El monto pagado debe ser mayor que cero',
      );
    }

    if (
      !Array.isArray(data.detalles) ||
      data.detalles.length === 0
    ) {
      throw new BadRequestException(
        'La venta debe contener productos',
      );
    }

    /*
     * Idempotencia:
     * si ya existe esta operación, devolvemos la venta
     * sin registrar ni descontar nuevamente.
     */
    const ventaExistente =
      await this.buscarVentaPorToken(
        tokenOperacion,
        montoPagado,
      );

    if (ventaExistente) {
      return {
        mensaje:
          'La venta ya había sido registrada anteriormente',
        venta: ventaExistente,
      };
    }

   const usuario =
  await this.obtenerDatosUsuario(idUsuario);

const turno =
  await this.obtenerTurnoActivo(idUsuario);

if (!turno) {
  throw new BadRequestException(
    'Debes abrir una caja antes de registrar una venta',
  );
}

    const clientes: any[] =
      await this.prisma.$queryRaw`
        SELECT
          c.id_cliente,
          tc.porcentaje_descuento
        FROM clientes c
        INNER JOIN tipos_cliente tc
          ON tc.id_tipo_cliente =
             c.id_tipo_cliente
        WHERE c.id_cliente = ${idCliente}
          AND c.estado = 1
          AND tc.estado = 1
        LIMIT 1
      `;

    if (clientes.length === 0) {
      throw new BadRequestException(
        'El cliente no existe o está inactivo',
      );
    }

    const porcentajeDescuento = Number(
      clientes[0].porcentaje_descuento,
    );

    const metodos: any[] =
      await this.prisma.$queryRaw`
        SELECT id_metodo_pago
        FROM metodos_pago
        WHERE id_metodo_pago = ${idMetodoPago}
          AND estado = 1
        LIMIT 1
      `;

    if (metodos.length === 0) {
      throw new BadRequestException(
        'El método de pago no existe o está inactivo',
      );
    }

    const detallesAgrupados =
      new Map<number, number>();

    for (const detalle of data.detalles) {
      const idVariante = Number(
        detalle.id_variante,
      );
      const cantidad = Number(detalle.cantidad);

      if (
        !Number.isInteger(idVariante) ||
        idVariante <= 0 ||
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      ) {
        throw new BadRequestException(
          'Todos los productos y cantidades deben ser válidos',
        );
      }

      detallesAgrupados.set(
        idVariante,
        (detallesAgrupados.get(idVariante) || 0) +
          cantidad,
      );
    }

    const tokenVentaTemporal = randomUUID();

    try {
      for (const [
        idVariante,
        cantidad,
      ] of detallesAgrupados.entries()) {
        const productos: any[] =
          await this.prisma.$queryRaw`
            SELECT
              pv.id_variante,
              pv.precio_venta,
              (
                i.stock_actual -
                i.stock_reservado
              ) AS stock_disponible
            FROM producto_variantes pv
            INNER JOIN productos p
              ON p.id_producto = pv.id_producto
            INNER JOIN inventario_sucursal i
              ON i.id_variante = pv.id_variante
            WHERE pv.id_variante = ${idVariante}
              AND i.id_sucursal =
                  ${usuario.id_sucursal}
              AND pv.estado = 1
              AND p.estado = 1
            LIMIT 1
          `;

        if (productos.length === 0) {
          throw new BadRequestException(
            `La variante ${idVariante} no está disponible en esta sucursal`,
          );
        }

        const precioUnitario = Number(
          productos[0].precio_venta,
        );

        const stockDisponible = Number(
          productos[0].stock_disponible,
        );

        if (stockDisponible < cantidad) {
          throw new BadRequestException(
            `Stock insuficiente. Disponible: ${stockDisponible}`,
          );
        }

        const bruto =
          precioUnitario * cantidad;

        const descuento = Number(
          (
            bruto *
            (porcentajeDescuento / 100)
          ).toFixed(2),
        );

        await this.prisma.$executeRaw`
          INSERT INTO venta_temp_detalle (
            token_venta,
            id_variante,
            cantidad,
            precio_unitario,
            descuento
          ) VALUES (
            ${tokenVentaTemporal},
            ${idVariante},
            ${cantidad},
            ${precioUnitario},
            ${descuento}
          )
        `;
      }

      /*
       * No dependemos del resultado devuelto por CALL.
       * Algunas versiones del driver retornan varios resultsets
       * y pueden producir un falso error al interpretarlos.
       */
      await this.prisma.$queryRawUnsafe(
        `
        CALL sp_registrar_venta(
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
        `,
        tokenVentaTemporal,
        tokenOperacion,
        idCliente,
        usuario.id_sucursal,
        idUsuario,
        turno.id_turno,
        idMetodoPago,
        montoPagado,
      );

      const ventaRegistrada =
        await this.buscarVentaPorToken(
          tokenOperacion,
          montoPagado,
        );

      if (!ventaRegistrada) {
        throw new BadRequestException(
          'La operación terminó, pero no fue posible localizar la venta',
        );
      }

      return {
        mensaje: ventaRegistrada.ya_registrada
          ? 'Venta registrada correctamente'
          : 'Venta registrada correctamente',
        venta: ventaRegistrada,
      };
    } catch (error: unknown) {
      /*
       * El procedimiento pudo confirmar la transacción y luego
       * el driver lanzar un error al interpretar los resultsets.
       * Antes de informar fallo, comprobamos el token.
       */
      const ventaRegistrada =
        await this.buscarVentaPorToken(
          tokenOperacion,
          montoPagado,
        );

      if (ventaRegistrada) {
        await this.prisma.$executeRaw`
          DELETE FROM venta_temp_detalle
          WHERE token_venta =
                ${tokenVentaTemporal}
        `;

        return {
          mensaje: 'Venta registrada correctamente',
          venta: ventaRegistrada,
        };
      }

      await this.prisma.$executeRaw`
        DELETE FROM venta_temp_detalle
        WHERE token_venta =
              ${tokenVentaTemporal}
      `;

      this.manejarErrorVenta(error);
    }
  }


  /**
   * Busca clientes bajo demanda por DPI, NIT o código.
   * Evita cargar la lista completa de clientes en catalogos().
   */
  async buscarClientes(
    idUsuario: number,
    valor?: string,
  ) {
    /*
     * Valida que el usuario autenticado tenga una
     * sucursal activa asignada.
     */
    await this.obtenerDatosUsuario(idUsuario);

    const busqueda = valor?.trim();

    if (!busqueda || busqueda.length < 3) {
      throw new BadRequestException(
        'Ingrese al menos 3 caracteres del DPI, NIT o código del cliente',
      );
    }

    /*
     * Permite buscar DPI y NIT aunque se escriban
     * con espacios o guiones.
     */
    const busquedaNormalizada =
      busqueda.replace(/[\s-]/g, '');

    const patronTexto = `%${busqueda}%`;
    const patronNormalizado =
      `%${busquedaNormalizada}%`;

    const clientes: any[] =
      await this.prisma.$queryRaw`
        SELECT
          c.id_cliente,
          c.codigo_cliente,
          TRIM(
            CONCAT(
              c.nombres,
              ' ',
              COALESCE(c.apellidos, '')
            )
          ) AS cliente,
          c.nit,
          c.dpi,
          c.telefono,
          c.direccion,
          tc.nombre AS tipo_cliente,
          tc.porcentaje_descuento
        FROM clientes c
        INNER JOIN tipos_cliente tc
          ON tc.id_tipo_cliente =
             c.id_tipo_cliente
        WHERE c.estado = 1
          AND tc.estado = 1
          AND (
            c.codigo_cliente LIKE ${patronTexto}

            OR REPLACE(
                 REPLACE(
                   COALESCE(c.nit, ''),
                   '-',
                   ''
                 ),
                 ' ',
                 ''
               ) LIKE ${patronNormalizado}

            OR REPLACE(
                 REPLACE(
                   COALESCE(c.dpi, ''),
                   '-',
                   ''
                 ),
                 ' ',
                 ''
               ) LIKE ${patronNormalizado}
          )
        ORDER BY
          CASE
            WHEN REPLACE(
                   REPLACE(
                     COALESCE(c.dpi, ''),
                     '-',
                     ''
                   ),
                   ' ',
                   ''
                 ) = ${busquedaNormalizada}
              THEN 1

            WHEN REPLACE(
                   REPLACE(
                     COALESCE(c.nit, ''),
                     '-',
                     ''
                   ),
                   ' ',
                   ''
                 ) = ${busquedaNormalizada}
              THEN 2

            WHEN c.codigo_cliente = ${busqueda}
              THEN 3

            ELSE 4
          END,
          c.nombres,
          c.apellidos
        LIMIT 10
      `;

    return clientes.map((cliente) => ({
      id_cliente: Number(cliente.id_cliente),
      codigo_cliente: cliente.codigo_cliente,
      cliente: cliente.cliente,
      nit: cliente.nit,
      dpi: cliente.dpi,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      tipo_cliente: cliente.tipo_cliente,
      porcentaje_descuento: Number(
        cliente.porcentaje_descuento,
      ),
    }));
  }

  private manejarErrorVenta(
    error: unknown,
  ): never {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    const errorDb = error as {
      code?: string;
      message?: string;
      meta?: {
        code?: string;
        message?: string;
      };
    };

    const mensaje = String(
      errorDb.meta?.message ||
        errorDb.message ||
        '',
    );

    if (
      mensaje.includes('STOCK_INSUFICIENTE') ||
      mensaje.includes(
        'No hay suficiente inventario',
      )
    ) {
      throw new BadRequestException(
        'No hay suficiente inventario para uno o más productos',
      );
    }

    if (
      mensaje.includes('PAGO_MENOR_TOTAL') ||
      mensaje.includes(
        'El pago es menor al total',
      )
    ) {
      throw new BadRequestException(
        'El monto pagado es menor al total de la venta',
      );
    }

    if (mensaje.includes('CAJA_NO_ABIERTA')) {
      throw new BadRequestException(
        'No tienes una caja abierta',
      );
    }

    if (mensaje.includes('CLIENTE_INVALIDO')) {
      throw new BadRequestException(
        'El cliente no existe o está inactivo',
      );
    }

    if (
      mensaje.includes('METODO_PAGO_INVALIDO')
    ) {
      throw new BadRequestException(
        'El método de pago no existe o está inactivo',
      );
    }

    if (
      mensaje.includes('VENTA_SIN_PRODUCTOS')
    ) {
      throw new BadRequestException(
        'La venta no contiene productos',
      );
    }

    if (
      mensaje.includes(
        'uk_ventas_token_operacion',
      ) ||
      mensaje.includes('Duplicate entry')
    ) {
      throw new BadRequestException(
        'La venta ya fue procesada',
      );
    }

    console.error(
      'Error técnico al registrar venta:',
      error,
    );

    throw new BadRequestException(
      'No fue posible registrar la venta',
    );
  }
}
