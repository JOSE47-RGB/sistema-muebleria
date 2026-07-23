import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateApartadoDto } from './dto/create-apartado.dto';
import { RegistrarAbonoDto } from './dto/registrar-abono.dto';
import { CancelarApartadoDto } from './dto/cancelar-apartado.dto';

type FiltrosApartados = {
  estado?: string;
  buscar?: string;
};

type ContextoUsuario = {
  id_usuario: number;
  id_sucursal: number;
  sucursal: string;
};

type TurnoActivo = {
  id_turno: number;
  id_caja: number;
  caja: string;
};

@Injectable()
export class ApartadosService {
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

  private normalizarToken(token?: string) {
    const tokenNormalizado = token?.trim();

    if (
      !tokenNormalizado ||
      tokenNormalizado.length !== 36
    ) {
      throw new BadRequestException(
        'El token de la operación es inválido',
      );
    }

    return tokenNormalizado;
  }

  private validarFecha(
    fecha: string | null | undefined,
    nombre: string,
  ) {
    const valor = fecha?.trim();

    if (
      !valor ||
      !/^\d{4}-\d{2}-\d{2}$/.test(valor)
    ) {
      throw new BadRequestException(
        `${nombre} es inválida`,
      );
    }

    const fechaInterpretada = new Date(
      `${valor}T00:00:00`,
    );

    if (
      Number.isNaN(fechaInterpretada.getTime())
    ) {
      throw new BadRequestException(
        `${nombre} es inválida`,
      );
    }

    return valor;
  }

  private async obtenerConfiguracionNumero(
    clave: string,
    valorPredeterminado: number,
  ) {
    const configuraciones: any[] =
      await this.prisma.$queryRaw`
        SELECT valor
        FROM configuraciones
        WHERE clave = ${clave}
          AND estado = 1
        LIMIT 1
      `;

    if (configuraciones.length === 0) {
      return valorPredeterminado;
    }

    const valor = Number(
      configuraciones[0].valor,
    );

    return Number.isFinite(valor)
      ? valor
      : valorPredeterminado;
  }

  private async obtenerContextoUsuario(
    idUsuario: number,
  ): Promise<ContextoUsuario> {
    this.validarId(
      idUsuario,
      'Identificador de usuario inválido',
    );

    const usuarios: any[] =
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
      id_sucursal: Number(
        usuarios[0].id_sucursal,
      ),
      sucursal: usuarios[0].sucursal,
    };
  }

  private async obtenerTurnoActivo(
    idUsuario: number,
    idSucursal: number,
  ): Promise<TurnoActivo> {
    const turnos: any[] =
      await this.prisma.$queryRaw`
        SELECT
          ct.id_turno,
          ct.id_caja,
          c.nombre AS caja
        FROM caja_turnos ct
        INNER JOIN cajas c
          ON c.id_caja = ct.id_caja
        INNER JOIN estados_sistema es
          ON es.id_estado = ct.id_estado
        WHERE ct.id_usuario = ${idUsuario}
          AND c.id_sucursal = ${idSucursal}
          AND ct.fecha_cierre IS NULL
          AND c.estado = 1
          AND es.modulo = 'CAJA'
          AND es.codigo = 'ABIERTA'
          AND es.estado = 1
        ORDER BY ct.fecha_apertura DESC
        LIMIT 1
      `;

    if (turnos.length === 0) {
      throw new BadRequestException(
        'Debes abrir caja antes de registrar apartados o abonos',
      );
    }

    return {
      id_turno: Number(turnos[0].id_turno),
      id_caja: Number(turnos[0].id_caja),
      caja: turnos[0].caja,
    };
  }

  async catalogos(idUsuario: number) {
    const usuario =
      await this.obtenerContextoUsuario(idUsuario);

    let turno: TurnoActivo | null = null;

    try {
      turno = await this.obtenerTurnoActivo(
        idUsuario,
        usuario.id_sucursal,
      );
    } catch {
      turno = null;
    }

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
          c.telefono,
          tc.nombre AS tipo_cliente,
          tc.porcentaje_descuento
        FROM clientes c
        INNER JOIN tipos_cliente tc
          ON tc.id_tipo_cliente =
             c.id_tipo_cliente
        WHERE c.estado = 1
          AND tc.estado = 1
        ORDER BY c.nombres, c.apellidos
      `;

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
          cat.nombre AS categoria,
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
        INNER JOIN categorias cat
          ON cat.id_categoria = p.id_categoria
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

    const porcentajeMinimoEntrega =
      await this.obtenerConfiguracionNumero(
        'APARTADO_PORCENTAJE_MINIMO_ENTREGA',
        85,
      );

    const maximoCuotas =
      await this.obtenerConfiguracionNumero(
        'APARTADO_MAXIMO_CUOTAS',
        24,
      );

    return {
      sucursal: {
        id_sucursal: usuario.id_sucursal,
        nombre: usuario.sucursal,
      },

      turno,

      politica: {
        porcentaje_minimo_entrega:
          porcentajeMinimoEntrega,
        maximo_cuotas: maximoCuotas,
        frecuencias_pago: [
          {
            codigo: 'SEMANAL',
            nombre: 'Semanal',
            dias_aproximados: 7,
          },
          {
            codigo: 'QUINCENAL',
            nombre: 'Quincenal',
            dias_aproximados: 15,
          },
          {
            codigo: 'MENSUAL',
            nombre: 'Mensual',
            dias_aproximados: 30,
          },
        ],
      },

      clientes: clientes.map((cliente) => ({
        id_cliente: Number(cliente.id_cliente),
        codigo_cliente: cliente.codigo_cliente,
        cliente: cliente.cliente,
        nit: cliente.nit,
        telefono: cliente.telefono,
        tipo_cliente: cliente.tipo_cliente,
        porcentaje_descuento: Number(
          cliente.porcentaje_descuento,
        ),
      })),

      productos: productos.map((producto) => ({
        id_variante: Number(producto.id_variante),
        id_producto: Number(producto.id_producto),
        codigo_producto: producto.codigo_producto,
        producto: producto.producto,
        codigo_variante:
          producto.codigo_variante,
        color: producto.color,
        material: producto.material,
        medida: producto.medida,
        precio_venta: Number(
          producto.precio_venta,
        ),
        marca: producto.marca,
        categoria: producto.categoria,
        stock_actual: Number(
          producto.stock_actual,
        ),
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
    };
  }

  async listar(
    idUsuario: number,
    filtros: FiltrosApartados,
  ) {
    const usuario =
      await this.obtenerContextoUsuario(idUsuario);

    const porcentajeMinimoEntrega =
      await this.obtenerConfiguracionNumero(
        'APARTADO_PORCENTAJE_MINIMO_ENTREGA',
        85,
      );

    let sql = `
      SELECT
        a.id_apartado,
        a.codigo_apartado,
        a.fecha_apartado,
        a.fecha_limite,
        a.total,
        a.enganche,
        a.saldo_pendiente,
        a.entregado,
        a.fecha_entrega,
        es.codigo AS codigo_estado,
        es.nombre AS estado,
        c.codigo_cliente,
        TRIM(
          CONCAT(
            c.nombres,
            ' ',
            COALESCE(c.apellidos, '')
          )
        ) AS cliente,
        u.usuario,
        ROUND(
          (
            (a.total - a.saldo_pendiente)
            / NULLIF(a.total, 0)
          ) * 100,
          2
        ) AS porcentaje_pagado,
        CASE
          WHEN a.entregado = 1 THEN 1
          WHEN (
            (
              a.total - a.saldo_pendiente
            ) / NULLIF(a.total, 0)
          ) * 100 >= ? THEN 1
          ELSE 0
        END AS elegible_entrega
      FROM apartados a
      INNER JOIN estados_sistema es
        ON es.id_estado = a.id_estado
      INNER JOIN clientes c
        ON c.id_cliente = a.id_cliente
      INNER JOIN usuarios u
        ON u.id_usuario = a.id_usuario
      WHERE a.id_sucursal = ?
    `;

    const parametros: unknown[] = [
      porcentajeMinimoEntrega,
      usuario.id_sucursal,
    ];

    if (filtros.estado?.trim()) {
      sql += ` AND es.codigo = ?`;

      parametros.push(
        filtros.estado.trim().toUpperCase(),
      );
    }

    if (filtros.buscar?.trim()) {
      const buscar =
        `%${filtros.buscar.trim()}%`;

      sql += `
        AND (
          a.codigo_apartado LIKE ?
          OR c.codigo_cliente LIKE ?
          OR c.nombres LIKE ?
          OR c.apellidos LIKE ?
          OR c.nit LIKE ?
        )
      `;

      parametros.push(
        buscar,
        buscar,
        buscar,
        buscar,
        buscar,
      );
    }

    sql += `
      ORDER BY
        CASE es.codigo
          WHEN 'ACTIVO' THEN 1
          WHEN 'VENCIDO' THEN 2
          WHEN 'COMPLETADO' THEN 3
          ELSE 4
        END,
        a.fecha_apartado DESC,
        a.id_apartado DESC
      LIMIT 300
    `;

    const apartados: any[] =
      await this.prisma.$queryRawUnsafe(
        sql,
        ...parametros,
      );

    return apartados.map((apartado) => ({
      id_apartado: Number(
        apartado.id_apartado,
      ),
      codigo_apartado:
        apartado.codigo_apartado,
      fecha_apartado:
        apartado.fecha_apartado,
      fecha_limite: apartado.fecha_limite,
      total: Number(apartado.total),
      enganche: Number(apartado.enganche),
      saldo_pendiente: Number(
        apartado.saldo_pendiente,
      ),
      total_pagado: Number(
        apartado.total,
      ) - Number(apartado.saldo_pendiente),
      porcentaje_pagado: Number(
        apartado.porcentaje_pagado,
      ),
      entregado: Number(apartado.entregado),
      fecha_entrega: apartado.fecha_entrega,
      elegible_entrega: Number(
        apartado.elegible_entrega,
      ),
      codigo_estado:
        apartado.codigo_estado,
      estado: apartado.estado,
      codigo_cliente:
        apartado.codigo_cliente,
      cliente: apartado.cliente,
      usuario: apartado.usuario,
    }));
  }

  async obtener(
    idApartado: number,
    idUsuario: number,
  ) {
    this.validarId(
      idApartado,
      'Identificador de apartado inválido',
    );

    const usuario =
      await this.obtenerContextoUsuario(idUsuario);

    const apartados: any[] =
      await this.prisma.$queryRaw`
        SELECT
          a.id_apartado,
          a.codigo_apartado,
          a.id_cliente,
          a.id_usuario,
          a.id_turno,
          a.fecha_apartado,
          a.fecha_limite,
          a.total,
          a.enganche,
          a.saldo_pendiente,
          a.cantidad_cuotas,
          a.frecuencia_pago,
          a.fecha_primer_pago,
          a.entregado,
          a.fecha_entrega,
          a.observaciones,
          es.codigo AS codigo_estado,
          es.nombre AS estado,
          c.codigo_cliente,
          TRIM(
            CONCAT(
              c.nombres,
              ' ',
              COALESCE(c.apellidos, '')
            )
          ) AS cliente,
          c.nit,
          c.telefono,
          c.direccion,
          u.usuario,
          s.nombre AS sucursal,
          ROUND(
            (
              (a.total - a.saldo_pendiente)
              / NULLIF(a.total, 0)
            ) * 100,
            2
          ) AS porcentaje_pagado
        FROM apartados a
        INNER JOIN estados_sistema es
          ON es.id_estado = a.id_estado
        INNER JOIN clientes c
          ON c.id_cliente = a.id_cliente
        INNER JOIN usuarios u
          ON u.id_usuario = a.id_usuario
        INNER JOIN sucursales s
          ON s.id_sucursal = a.id_sucursal
        WHERE a.id_apartado = ${idApartado}
          AND a.id_sucursal =
              ${usuario.id_sucursal}
        LIMIT 1
      `;

    if (apartados.length === 0) {
      throw new NotFoundException(
        'Apartado no encontrado',
      );
    }

    const detalles: any[] =
      await this.prisma.$queryRaw`
        SELECT
          ad.id_apartado_detalle,
          ad.id_variante,
          p.codigo_producto,
          p.nombre AS producto,
          pv.codigo_variante,
          pv.color,
          pv.material,
          pv.medida,
          ad.cantidad,
          ad.precio_unitario,
          ad.descuento,
          ad.subtotal
        FROM apartado_detalle ad
        INNER JOIN producto_variantes pv
          ON pv.id_variante = ad.id_variante
        INNER JOIN productos p
          ON p.id_producto = pv.id_producto
        WHERE ad.id_apartado = ${idApartado}
        ORDER BY ad.id_apartado_detalle
      `;

    const pagos: any[] =
      await this.prisma.$queryRaw`
        SELECT
          pg.id_pago,
          pg.token_operacion,
          pg.id_metodo_pago,
          mp.codigo AS codigo_metodo,
          mp.nombre AS metodo_pago,
          pg.monto,
          pg.referencia,
          pg.fecha
        FROM pagos pg
        INNER JOIN metodos_pago mp
          ON mp.id_metodo_pago =
             pg.id_metodo_pago
        WHERE pg.id_apartado = ${idApartado}
        ORDER BY pg.fecha, pg.id_pago
      `;

    const apartado = apartados[0];

    const total = Number(apartado.total);
    const saldo = Number(
      apartado.saldo_pendiente,
    );

    const porcentaje = Number(
      apartado.porcentaje_pagado,
    );

    const porcentajeMinimoEntrega =
      await this.obtenerConfiguracionNumero(
        'APARTADO_PORCENTAJE_MINIMO_ENTREGA',
        85,
      );

    const cuotas = await this.listarCuotas(
      idApartado,
      idUsuario,
    );

    return {
      id_apartado: Number(
        apartado.id_apartado,
      ),
      codigo_apartado:
        apartado.codigo_apartado,
      id_cliente: Number(apartado.id_cliente),
      id_usuario: Number(apartado.id_usuario),
      id_turno: Number(apartado.id_turno),
      fecha_apartado:
        apartado.fecha_apartado,
      fecha_limite: apartado.fecha_limite,
      total,
      enganche: Number(apartado.enganche),
      saldo_pendiente: saldo,
      cantidad_cuotas: apartado.cantidad_cuotas
        ? Number(apartado.cantidad_cuotas)
        : null,
      frecuencia_pago:
        apartado.frecuencia_pago,
      fecha_primer_pago:
        apartado.fecha_primer_pago,
      total_pagado: Number(
        (total - saldo).toFixed(2),
      ),
      porcentaje_pagado: porcentaje,
      elegible_entrega:
        porcentaje >= porcentajeMinimoEntrega,
      entregado: Number(apartado.entregado),
      fecha_entrega: apartado.fecha_entrega,
      observaciones: apartado.observaciones,
      codigo_estado:
        apartado.codigo_estado,
      estado: apartado.estado,
      cliente: {
        codigo: apartado.codigo_cliente,
        nombre: apartado.cliente,
        nit: apartado.nit,
        telefono: apartado.telefono,
        direccion: apartado.direccion,
      },
      usuario: apartado.usuario,
      sucursal: apartado.sucursal,

      detalles: detalles.map((detalle) => ({
        id_apartado_detalle: Number(
          detalle.id_apartado_detalle,
        ),
        id_variante: Number(
          detalle.id_variante,
        ),
        codigo_producto:
          detalle.codigo_producto,
        producto: detalle.producto,
        codigo_variante:
          detalle.codigo_variante,
        color: detalle.color,
        material: detalle.material,
        medida: detalle.medida,
        cantidad: Number(detalle.cantidad),
        precio_unitario: Number(
          detalle.precio_unitario,
        ),
        descuento: Number(
          detalle.descuento,
        ),
        subtotal: Number(detalle.subtotal),
      })),

      cuotas,

      pagos: pagos.map((pago) => ({
        id_pago: Number(pago.id_pago),
        token_operacion:
          pago.token_operacion,
        id_metodo_pago: Number(
          pago.id_metodo_pago,
        ),
        codigo_metodo:
          pago.codigo_metodo,
        metodo_pago: pago.metodo_pago,
        monto: Number(pago.monto),
        referencia: pago.referencia,
        fecha: pago.fecha,
      })),
    };
  }

  async listarCuotas(
    idApartado: number,
    idUsuario: number,
  ) {
    this.validarId(
      idApartado,
      'Identificador de apartado inválido',
    );

    const contexto =
      await this.obtenerContextoUsuario(idUsuario);

    const existe: any[] =
      await this.prisma.$queryRaw`
        SELECT id_apartado
        FROM apartados
        WHERE id_apartado = ${idApartado}
          AND id_sucursal =
              ${contexto.id_sucursal}
        LIMIT 1
      `;

    if (existe.length === 0) {
      throw new NotFoundException(
        'Apartado no encontrado',
      );
    }

    const cuotas: any[] =
      await this.prisma.$queryRaw`
        SELECT
          vc.id_cuota,
          vc.numero_cuota,
          vc.fecha_vencimiento,
          vc.monto_programado,
          vc.monto_pagado,
          vc.saldo,
          vc.interes_mora,
          vc.dias_atraso,
          es.codigo AS codigo_estado,
          es.nombre AS estado,
          CASE
            WHEN vc.saldo <= 0 THEN 'PAGADA'
            WHEN vc.fecha_vencimiento < CURDATE()
                 AND vc.saldo > 0 THEN 'VENCIDA'
            WHEN vc.monto_pagado > 0
                 AND vc.saldo > 0 THEN 'PARCIAL'
            ELSE 'PENDIENTE'
          END AS estado_calculado,
          DATEDIFF(
            vc.fecha_vencimiento,
            CURDATE()
          ) AS dias_para_vencer
        FROM venta_cuotas vc
        INNER JOIN estados_sistema es
          ON es.id_estado = vc.id_estado
        WHERE vc.tipo_origen = 'APARTADO'
          AND vc.id_apartado = ${idApartado}
        ORDER BY vc.numero_cuota
      `;

    return cuotas.map((cuota) => ({
      id_cuota: Number(cuota.id_cuota),
      numero_cuota: Number(
        cuota.numero_cuota,
      ),
      fecha_vencimiento:
        cuota.fecha_vencimiento,
      monto_programado: Number(
        cuota.monto_programado,
      ),
      monto_pagado: Number(
        cuota.monto_pagado,
      ),
      saldo: Number(cuota.saldo),
      interes_mora: Number(
        cuota.interes_mora,
      ),
      dias_atraso: Number(
        cuota.dias_atraso,
      ),
      dias_para_vencer: Number(
        cuota.dias_para_vencer,
      ),
      codigo_estado:
        cuota.codigo_estado,
      estado: cuota.estado,
      estado_calculado:
        cuota.estado_calculado,
    }));
  }

  private async buscarPorToken(
    tokenOperacion: string,
    idUsuario: number,
  ) {
    const apartados: any[] =
      await this.prisma.$queryRaw`
        SELECT id_apartado
        FROM apartados
        WHERE token_operacion =
              ${tokenOperacion}
        LIMIT 1
      `;

    if (apartados.length === 0) {
      return null;
    }

    return this.obtener(
      Number(apartados[0].id_apartado),
      idUsuario,
    );
  }

  async crear(
    data: CreateApartadoDto,
    idUsuario: number,
  ) {
    const tokenOperacion =
      this.normalizarToken(data.token_operacion);

    const existente =
      await this.buscarPorToken(
        tokenOperacion,
        idUsuario,
      );

    if (existente) {
      return {
        mensaje:
          'El apartado ya había sido registrado',
        apartado: existente,
      };
    }

    const idCliente = Number(data.id_cliente);
    const idMetodoPago = Number(
      data.id_metodo_pago,
    );
    const enganche = Number(data.enganche);

    const cantidadCuotas = Number(
      data.cantidad_cuotas,
    );

    const frecuenciaPago =
      data.frecuencia_pago
        ?.trim()
        .toUpperCase();

    const fechaPrimerPago = this.validarFecha(
      data.fecha_primer_pago,
      'La fecha del primer pago',
    );

    const maximoCuotas =
      await this.obtenerConfiguracionNumero(
        'APARTADO_MAXIMO_CUOTAS',
        24,
      );

    this.validarId(
      idCliente,
      'Debes seleccionar un cliente',
    );

    this.validarId(
      idMetodoPago,
      'Debes seleccionar un método de pago',
    );

    if (
      !Number.isFinite(enganche) ||
      enganche < 0
    ) {
      throw new BadRequestException(
        'El enganche no puede ser negativo',
      );
    }

    if (
      !Number.isInteger(cantidadCuotas) ||
      cantidadCuotas < 1 ||
      cantidadCuotas > maximoCuotas
    ) {
      throw new BadRequestException(
        `La cantidad de cuotas debe estar entre 1 y ${maximoCuotas}`,
      );
    }

    if (
      ![
        'SEMANAL',
        'QUINCENAL',
        'MENSUAL',
      ].includes(frecuenciaPago)
    ) {
      throw new BadRequestException(
        'La frecuencia de pago es inválida',
      );
    }

    if (
      !Array.isArray(data.detalles) ||
      data.detalles.length === 0
    ) {
      throw new BadRequestException(
        'El apartado debe contener productos',
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
          'Los productos y cantidades deben ser válidos',
        );
      }

      detallesAgrupados.set(
        idVariante,
        (detallesAgrupados.get(idVariante) || 0) +
          cantidad,
      );
    }

    const contexto =
      await this.obtenerContextoUsuario(idUsuario);

    const turno =
      await this.obtenerTurnoActivo(
        idUsuario,
        contexto.id_sucursal,
      );

    try {
      const idApartado =
        await this.prisma.$transaction(
          async (tx) => {
            const cliente: any[] =
              await tx.$queryRaw`
                SELECT id_cliente
                FROM clientes
                WHERE id_cliente = ${idCliente}
                  AND estado = 1
                LIMIT 1
              `;

            if (cliente.length === 0) {
              throw new BadRequestException(
                'El cliente no existe o está inactivo',
              );
            }

            const metodoPago: any[] =
              await tx.$queryRaw`
                SELECT
                  id_metodo_pago,
                  requiere_referencia
                FROM metodos_pago
                WHERE id_metodo_pago =
                      ${idMetodoPago}
                  AND estado = 1
                LIMIT 1
              `;

            if (metodoPago.length === 0) {
              throw new BadRequestException(
                'El método de pago no existe o está inactivo',
              );
            }

            if (
              Number(
                metodoPago[0].requiere_referencia,
              ) === 1 &&
              !data.referencia_pago?.trim()
            ) {
              throw new BadRequestException(
                'El método de pago requiere referencia',
              );
            }

            const estadoActivo: any[] =
              await tx.$queryRaw`
                SELECT id_estado
                FROM estados_sistema
                WHERE modulo = 'APARTADO'
                  AND codigo = 'ACTIVO'
                  AND estado = 1
                LIMIT 1
              `;

            if (estadoActivo.length === 0) {
              throw new BadRequestException(
                'No existe el estado APARTADO/ACTIVO',
              );
            }

            const tipoReserva: any[] =
              await tx.$queryRaw`
                SELECT id_tipo_movimiento
                FROM tipos_movimiento_inventario
                WHERE codigo =
                      'RESERVA_APARTADO'
                  AND estado = 1
                LIMIT 1
              `;

            if (tipoReserva.length === 0) {
              throw new BadRequestException(
                'No existe el movimiento RESERVA_APARTADO',
              );
            }

            const tipoCajaAbono: any[] =
              await tx.$queryRaw`
                SELECT id_tipo_movimiento_caja
                FROM tipos_movimiento_caja
                WHERE codigo = 'ABONO'
                  AND afecta_caja = 1
                  AND estado = 1
                LIMIT 1
              `;

            if (tipoCajaAbono.length === 0) {
              throw new BadRequestException(
                'No existe el movimiento de caja ABONO',
              );
            }

            const detallesProcesados: Array<{
              id_variante: number;
              cantidad: number;
              precio_unitario: number;
              descuento: number;
              subtotal: number;
            }> = [];

            let total = 0;

            for (const [
              idVariante,
              cantidad,
            ] of detallesAgrupados.entries()) {
              const productos: any[] =
                await tx.$queryRaw`
                  SELECT
                    pv.id_variante,
                    pv.precio_venta,
                    i.stock_actual,
                    i.stock_reservado
                  FROM producto_variantes pv
                  INNER JOIN productos p
                    ON p.id_producto =
                       pv.id_producto
                  INNER JOIN inventario_sucursal i
                    ON i.id_variante =
                       pv.id_variante
                  WHERE pv.id_variante =
                        ${idVariante}
                    AND i.id_sucursal =
                        ${contexto.id_sucursal}
                    AND pv.estado = 1
                    AND p.estado = 1
                  LIMIT 1
                  FOR UPDATE
                `;

              if (productos.length === 0) {
                throw new BadRequestException(
                  `La variante ${idVariante} no está disponible`,
                );
              }

              const stockActual = Number(
                productos[0].stock_actual,
              );

              const stockReservado = Number(
                productos[0].stock_reservado,
              );

              const disponible =
                stockActual - stockReservado;

              if (disponible < cantidad) {
                throw new BadRequestException(
                  `Stock insuficiente para la variante ${idVariante}. Disponible: ${disponible}`,
                );
              }

              const precio = Number(
                productos[0].precio_venta,
              );

              const subtotal = Number(
                (precio * cantidad).toFixed(2),
              );

              total = Number(
                (total + subtotal).toFixed(2),
              );

              detallesProcesados.push({
                id_variante: idVariante,
                cantidad,
                precio_unitario: precio,
                descuento: 0,
                subtotal,
              });
            }

            if (total <= 0) {
              throw new BadRequestException(
                'El total del apartado es inválido',
              );
            }

            if (enganche > total) {
              throw new BadRequestException(
                'El enganche no puede superar el total',
              );
            }

            const saldoPendiente = Number(
              (total - enganche).toFixed(2),
            );

            const codigoTemporal =
              `TMP-${tokenOperacion}`;

            await tx.$executeRaw`
              INSERT INTO apartados (
                codigo_apartado,
                token_operacion,
                id_cliente,
                id_sucursal,
                id_usuario,
                id_turno,
                id_estado,
                fecha_apartado,
                total,
                enganche,
                saldo_pendiente,
                cantidad_cuotas,
                frecuencia_pago,
                fecha_primer_pago,
                entregado,
                fecha_limite,
                observaciones
              ) VALUES (
                ${codigoTemporal},
                ${tokenOperacion},
                ${idCliente},
                ${contexto.id_sucursal},
                ${idUsuario},
                ${turno.id_turno},
                ${Number(
                  estadoActivo[0].id_estado,
                )},
                NOW(),
                ${total},
                ${enganche},
                ${saldoPendiente},
                ${cantidadCuotas},
                ${frecuenciaPago},
                ${fechaPrimerPago},
                0,
                NULL,
                ${
                  data.observaciones?.trim() ||
                  null
                }
              )
            `;

            const resultadoId: any[] =
              await tx.$queryRaw`
                SELECT LAST_INSERT_ID()
                       AS id_apartado
              `;

            const nuevoId = Number(
              resultadoId[0]?.id_apartado,
            );

            if (
              !Number.isInteger(nuevoId) ||
              nuevoId <= 0
            ) {
              throw new BadRequestException(
                'No fue posible crear el apartado',
              );
            }

            const codigoApartado =
              `APA${String(nuevoId).padStart(
                6,
                '0',
              )}`;

            await tx.$executeRaw`
              UPDATE apartados
              SET codigo_apartado =
                  ${codigoApartado}
              WHERE id_apartado = ${nuevoId}
            `;

            for (const detalle of detallesProcesados) {
              await tx.$executeRaw`
                INSERT INTO apartado_detalle (
                  id_apartado,
                  id_variante,
                  cantidad,
                  precio_unitario,
                  descuento,
                  subtotal
                ) VALUES (
                  ${nuevoId},
                  ${detalle.id_variante},
                  ${detalle.cantidad},
                  ${detalle.precio_unitario},
                  ${detalle.descuento},
                  ${detalle.subtotal}
                )
              `;

              const actualizados =
                await tx.$executeRaw`
                  UPDATE inventario_sucursal
                  SET stock_reservado =
                      stock_reservado +
                      ${detalle.cantidad}
                  WHERE id_sucursal =
                        ${contexto.id_sucursal}
                    AND id_variante =
                        ${detalle.id_variante}
                    AND (
                      stock_actual -
                      stock_reservado
                    ) >= ${detalle.cantidad}
                `;

              if (Number(actualizados) !== 1) {
                throw new BadRequestException(
                  'El inventario cambió durante la operación. Intenta nuevamente',
                );
              }

              await tx.$executeRaw`
                INSERT INTO inventario_movimientos (
                  id_sucursal,
                  id_variante,
                  id_usuario,
                  id_tipo_movimiento,
                  cantidad,
                  referencia,
                  descripcion,
                  fecha
                ) VALUES (
                  ${contexto.id_sucursal},
                  ${detalle.id_variante},
                  ${idUsuario},
                  ${Number(
                    tipoReserva[0]
                      .id_tipo_movimiento,
                  )},
                  ${detalle.cantidad},
                  ${codigoApartado},
                  'Reserva automática por ApartadoYA',
                  NOW()
                )
              `;
            }

            if (enganche > 0) {
              await tx.$executeRaw`
                INSERT INTO pagos (
                  token_operacion,
                  id_venta,
                  id_apartado,
                  id_turno,
                  id_metodo_pago,
                  monto,
                  referencia,
                  fecha
                ) VALUES (
                  ${tokenOperacion},
                  NULL,
                  ${nuevoId},
                  ${turno.id_turno},
                  ${idMetodoPago},
                  ${enganche},
                  ${
                    data.referencia_pago?.trim() ||
                    codigoApartado
                  },
                  NOW()
                )
              `;

              await tx.$executeRaw`
                INSERT INTO caja_movimientos (
                  id_turno,
                  id_tipo_movimiento_caja,
                  id_metodo_pago,
                  monto,
                  referencia,
                  descripcion,
                  fecha
                ) VALUES (
                  ${turno.id_turno},
                  ${Number(
                    tipoCajaAbono[0]
                      .id_tipo_movimiento_caja,
                  )},
                  ${idMetodoPago},
                  ${enganche},
                  ${codigoApartado},
                  'Enganche de ApartadoYA',
                  NOW()
                )
              `;

              await tx.$executeRaw`
                UPDATE caja_turnos
                SET monto_esperado =
                    monto_esperado + ${enganche}
                WHERE id_turno =
                      ${turno.id_turno}
                  AND fecha_cierre IS NULL
              `;
            }

            await this.generarDocumentoApartadoTx(
              tx,
              {
                idApartado: nuevoId,
                codigoApartado,
                idCliente,
                idUsuario,
                idSucursal:
                  contexto.id_sucursal,
                total,
                enganche,
                detalles: detallesProcesados,
                idMetodoPago,
              },
            );

            if (saldoPendiente > 0) {
              await tx.$executeRaw`
                CALL sp_generar_cuotas_apartado(
                  ${nuevoId}
                )
              `;
            }

            return nuevoId;
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel
                .Serializable,
            timeout: 30000,
          },
        );

      return {
        mensaje: 'Apartado registrado correctamente',
        apartado: await this.obtener(
          idApartado,
          idUsuario,
        ),
      };
    } catch (error: unknown) {
      const existenteDespues =
        await this.buscarPorToken(
          tokenOperacion,
          idUsuario,
        );

      if (existenteDespues) {
        return {
          mensaje:
            'El apartado ya había sido registrado',
          apartado: existenteDespues,
        };
      }

      this.manejarError(error);
    }
  }

  async registrarAbono(
    idApartado: number,
    data: RegistrarAbonoDto,
    idUsuario: number,
  ) {
    this.validarId(
      idApartado,
      'Identificador de apartado inválido',
    );

    const tokenOperacion =
      this.normalizarToken(data.token_operacion);

    const idMetodoPago = Number(
      data.id_metodo_pago,
    );

    const monto = Number(data.monto);

    this.validarId(
      idMetodoPago,
      'Debes seleccionar un método de pago',
    );

    if (
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      throw new BadRequestException(
        'El monto del abono debe ser mayor que cero',
      );
    }

    const pagoExistente: any[] =
      await this.prisma.$queryRaw`
        SELECT id_pago
        FROM pagos
        WHERE token_operacion =
              ${tokenOperacion}
        LIMIT 1
      `;

    if (pagoExistente.length > 0) {
      return {
        mensaje:
          'El abono ya había sido registrado',
        apartado: await this.obtener(
          idApartado,
          idUsuario,
        ),
      };
    }

    const contexto =
      await this.obtenerContextoUsuario(idUsuario);

    const turno =
      await this.obtenerTurnoActivo(
        idUsuario,
        contexto.id_sucursal,
      );

    try {
      await this.prisma.$transaction(
        async (tx) => {
          const apartados: any[] =
            await tx.$queryRaw`
              SELECT
                a.id_apartado,
                a.codigo_apartado,
                a.id_cliente,
                a.total,
                a.saldo_pendiente,
                a.entregado,
                es.codigo AS codigo_estado
              FROM apartados a
              INNER JOIN estados_sistema es
                ON es.id_estado = a.id_estado
              WHERE a.id_apartado =
                    ${idApartado}
                AND a.id_sucursal =
                    ${contexto.id_sucursal}
              LIMIT 1
              FOR UPDATE
            `;

          if (apartados.length === 0) {
            throw new NotFoundException(
              'Apartado no encontrado',
            );
          }

          const apartado = apartados[0];

          if (
            apartado.codigo_estado !== 'ACTIVO'
          ) {
            throw new BadRequestException(
              'Solo se puede abonar a un apartado activo',
            );
          }

          const saldo = Number(
            apartado.saldo_pendiente,
          );

          if (monto > saldo) {
            throw new BadRequestException(
              `El abono no puede superar el saldo pendiente de Q${saldo.toFixed(
                2,
              )}`,
            );
          }

          const metodo: any[] =
            await tx.$queryRaw`
              SELECT requiere_referencia
              FROM metodos_pago
              WHERE id_metodo_pago =
                    ${idMetodoPago}
                AND estado = 1
              LIMIT 1
            `;

          if (metodo.length === 0) {
            throw new BadRequestException(
              'El método de pago no existe o está inactivo',
            );
          }

          if (
            Number(
              metodo[0].requiere_referencia,
            ) === 1 &&
            !data.referencia?.trim()
          ) {
            throw new BadRequestException(
              'El método de pago requiere referencia',
            );
          }

          const tipoCaja: any[] =
            await tx.$queryRaw`
              SELECT id_tipo_movimiento_caja
              FROM tipos_movimiento_caja
              WHERE codigo = 'ABONO'
                AND afecta_caja = 1
                AND estado = 1
              LIMIT 1
            `;

          if (tipoCaja.length === 0) {
            throw new BadRequestException(
              'No existe el movimiento de caja ABONO',
            );
          }

          const nuevoSaldo = Number(
            (saldo - monto).toFixed(2),
          );

          await tx.$executeRaw`
            INSERT INTO pagos (
              token_operacion,
              id_venta,
              id_apartado,
              id_turno,
              id_metodo_pago,
              monto,
              referencia,
              fecha
            ) VALUES (
              ${tokenOperacion},
              NULL,
              ${idApartado},
              ${turno.id_turno},
              ${idMetodoPago},
              ${monto},
              ${
                data.referencia?.trim() ||
                apartado.codigo_apartado
              },
              NOW()
            )
          `;

          const resultadoPago: any[] =
            await tx.$queryRaw`
              SELECT LAST_INSERT_ID()
                     AS id_pago
            `;

          const idPago = Number(
            resultadoPago[0]?.id_pago,
          );

          if (
            !Number.isInteger(idPago) ||
            idPago <= 0
          ) {
            throw new BadRequestException(
              'No fue posible identificar el pago',
            );
          }

          await tx.$executeRaw`
            CALL sp_aplicar_pago_apartado(
              ${idApartado},
              ${idPago}
            )
          `;

          await tx.$executeRaw`
            UPDATE apartados
            SET saldo_pendiente =
                ${nuevoSaldo}
            WHERE id_apartado =
                  ${idApartado}
          `;

          await tx.$executeRaw`
            INSERT INTO caja_movimientos (
              id_turno,
              id_tipo_movimiento_caja,
              id_metodo_pago,
              monto,
              referencia,
              descripcion,
              fecha
            ) VALUES (
              ${turno.id_turno},
              ${Number(
                tipoCaja[0]
                  .id_tipo_movimiento_caja,
              )},
              ${idMetodoPago},
              ${monto},
              ${apartado.codigo_apartado},
              'Abono de ApartadoYA',
              NOW()
            )
          `;

          await tx.$executeRaw`
            UPDATE caja_turnos
            SET monto_esperado =
                monto_esperado + ${monto}
            WHERE id_turno =
                  ${turno.id_turno}
              AND fecha_cierre IS NULL
          `;

          await this.generarDocumentoAbonoTx(
            tx,
            {
              idPago,
              idApartado,
              codigoApartado:
                apartado.codigo_apartado,
              idCliente: Number(
                apartado.id_cliente,
              ),
              idUsuario,
              idSucursal:
                contexto.id_sucursal,
              idMetodoPago,
              monto,
              nuevoSaldo,
            },
          );
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
          timeout: 30000,
        },
      );

      return {
        mensaje: 'Abono registrado correctamente',
        apartado: await this.obtener(
          idApartado,
          idUsuario,
        ),
      };
    } catch (error: unknown) {
      const pago: any[] =
        await this.prisma.$queryRaw`
          SELECT id_pago
          FROM pagos
          WHERE token_operacion =
                ${tokenOperacion}
          LIMIT 1
        `;

      if (pago.length > 0) {
        return {
          mensaje:
            'El abono ya había sido registrado',
          apartado: await this.obtener(
            idApartado,
            idUsuario,
          ),
        };
      }

      this.manejarError(error);
    }
  }

  async entregar(
    idApartado: number,
    idUsuario: number,
  ) {
    this.validarId(
      idApartado,
      'Identificador de apartado inválido',
    );

    const contexto =
      await this.obtenerContextoUsuario(idUsuario);

    const porcentajeMinimoEntrega =
      await this.obtenerConfiguracionNumero(
        'APARTADO_PORCENTAJE_MINIMO_ENTREGA',
        85,
      );

    await this.prisma.$transaction(
      async (tx) => {
        const apartados: any[] =
          await tx.$queryRaw`
            SELECT
              a.id_apartado,
              a.codigo_apartado,
              a.total,
              a.saldo_pendiente,
              a.entregado,
              es.codigo AS codigo_estado
            FROM apartados a
            INNER JOIN estados_sistema es
              ON es.id_estado = a.id_estado
            WHERE a.id_apartado =
                  ${idApartado}
              AND a.id_sucursal =
                  ${contexto.id_sucursal}
            LIMIT 1
            FOR UPDATE
          `;

        if (apartados.length === 0) {
          throw new NotFoundException(
            'Apartado no encontrado',
          );
        }

        const apartado = apartados[0];

        if (Number(apartado.entregado) === 1) {
          throw new BadRequestException(
            'Los productos ya fueron entregados',
          );
        }

        if (
          apartado.codigo_estado !== 'ACTIVO'
        ) {
          throw new BadRequestException(
            'El apartado no está activo',
          );
        }

        const total = Number(apartado.total);
        const saldo = Number(
          apartado.saldo_pendiente,
        );

        const porcentaje =
          ((total - saldo) / total) * 100;

        if (
          porcentaje < porcentajeMinimoEntrega
        ) {
          throw new BadRequestException(
            `El cliente ha pagado ${porcentaje.toFixed(
              2,
            )}%. Debe alcanzar al menos el ${porcentajeMinimoEntrega}%`,
          );
        }

        const detalles: any[] =
          await tx.$queryRaw`
            SELECT
              ad.id_variante,
              ad.cantidad
            FROM apartado_detalle ad
            WHERE ad.id_apartado =
                  ${idApartado}
            ORDER BY ad.id_variante
          `;

        const tipoSalida: any[] =
          await tx.$queryRaw`
            SELECT id_tipo_movimiento
            FROM tipos_movimiento_inventario
            WHERE codigo = 'SALIDA_VENTA'
              AND estado = 1
            LIMIT 1
          `;

        if (tipoSalida.length === 0) {
          throw new BadRequestException(
            'No existe el movimiento SALIDA_VENTA',
          );
        }

        for (const detalle of detalles) {
          const cantidad = Number(
            detalle.cantidad,
          );

          const actualizados =
            await tx.$executeRaw`
              UPDATE inventario_sucursal
              SET
                stock_actual =
                  stock_actual - ${cantidad},
                stock_reservado =
                  stock_reservado - ${cantidad}
              WHERE id_sucursal =
                    ${contexto.id_sucursal}
                AND id_variante =
                    ${Number(
                      detalle.id_variante,
                    )}
                AND stock_actual >= ${cantidad}
                AND stock_reservado >= ${cantidad}
            `;

          if (Number(actualizados) !== 1) {
            throw new BadRequestException(
              'El inventario reservado no es suficiente para completar la entrega',
            );
          }

          await tx.$executeRaw`
            INSERT INTO inventario_movimientos (
              id_sucursal,
              id_variante,
              id_usuario,
              id_tipo_movimiento,
              cantidad,
              referencia,
              descripcion,
              fecha
            ) VALUES (
              ${contexto.id_sucursal},
              ${Number(
                detalle.id_variante,
              )},
              ${idUsuario},
              ${Number(
                tipoSalida[0]
                  .id_tipo_movimiento,
              )},
              ${cantidad},
              ${apartado.codigo_apartado},
              'Entrega física de ApartadoYA',
              NOW()
            )
          `;
        }

        await tx.$executeRaw`
          UPDATE apartados
          SET
            entregado = 1,
            fecha_entrega = NOW(),
            id_usuario_entrega =
              ${idUsuario}
          WHERE id_apartado = ${idApartado}
        `;

        /*
         * Si ya está pagado completamente,
         * también se marca como COMPLETADO.
         */
        if (saldo === 0) {
          const estadoCompletado: any[] =
            await tx.$queryRaw`
              SELECT id_estado
              FROM estados_sistema
              WHERE modulo = 'APARTADO'
                AND codigo = 'COMPLETADO'
                AND estado = 1
              LIMIT 1
            `;

          if (estadoCompletado.length === 0) {
            throw new BadRequestException(
              'No existe el estado APARTADO/COMPLETADO',
            );
          }

          await tx.$executeRaw`
            UPDATE apartados
            SET id_estado =
                ${Number(
                  estadoCompletado[0].id_estado,
                )}
            WHERE id_apartado =
                  ${idApartado}
          `;
        }
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel
            .Serializable,
        timeout: 30000,
      },
    );

    return {
      mensaje: 'Productos entregados correctamente',
      apartado: await this.obtener(
        idApartado,
        idUsuario,
      ),
    };
  }

  async cancelar(
    idApartado: number,
    data: CancelarApartadoDto,
    idUsuario: number,
  ) {
    this.validarId(
      idApartado,
      'Identificador de apartado inválido',
    );

    const motivo = data.motivo?.trim();

    if (!motivo || motivo.length < 5) {
      throw new BadRequestException(
        'Debes indicar el motivo de cancelación',
      );
    }

    const contexto =
      await this.obtenerContextoUsuario(idUsuario);

    await this.prisma.$transaction(
      async (tx) => {
        const apartados: any[] =
          await tx.$queryRaw`
            SELECT
              a.codigo_apartado,
              a.entregado,
              es.codigo AS codigo_estado
            FROM apartados a
            INNER JOIN estados_sistema es
              ON es.id_estado = a.id_estado
            WHERE a.id_apartado =
                  ${idApartado}
              AND a.id_sucursal =
                  ${contexto.id_sucursal}
            LIMIT 1
            FOR UPDATE
          `;

        if (apartados.length === 0) {
          throw new NotFoundException(
            'Apartado no encontrado',
          );
        }

        const apartado = apartados[0];

        if (
          apartado.codigo_estado !== 'ACTIVO'
        ) {
          throw new BadRequestException(
            'Solo se puede cancelar un apartado activo',
          );
        }

        if (Number(apartado.entregado) === 1) {
          throw new BadRequestException(
            'No se puede cancelar porque los productos ya fueron entregados',
          );
        }

        const estadoCancelado: any[] =
          await tx.$queryRaw`
            SELECT id_estado
            FROM estados_sistema
            WHERE modulo = 'APARTADO'
              AND codigo = 'CANCELADO'
              AND estado = 1
            LIMIT 1
          `;

        const tipoLiberacion: any[] =
          await tx.$queryRaw`
            SELECT id_tipo_movimiento
            FROM tipos_movimiento_inventario
            WHERE codigo =
                  'LIBERACION_APARTADO'
              AND estado = 1
            LIMIT 1
          `;

        if (
          estadoCancelado.length === 0 ||
          tipoLiberacion.length === 0
        ) {
          throw new BadRequestException(
            'Falta configuración para cancelar apartados',
          );
        }

        const detalles: any[] =
          await tx.$queryRaw`
            SELECT id_variante, cantidad
            FROM apartado_detalle
            WHERE id_apartado = ${idApartado}
            ORDER BY id_variante
          `;

        for (const detalle of detalles) {
          const cantidad = Number(
            detalle.cantidad,
          );

          const actualizados =
            await tx.$executeRaw`
              UPDATE inventario_sucursal
              SET stock_reservado =
                  stock_reservado - ${cantidad}
              WHERE id_sucursal =
                    ${contexto.id_sucursal}
                AND id_variante =
                    ${Number(
                      detalle.id_variante,
                    )}
                AND stock_reservado >=
                    ${cantidad}
            `;

          if (Number(actualizados) !== 1) {
            throw new BadRequestException(
              'No fue posible liberar el inventario reservado',
            );
          }

          await tx.$executeRaw`
            INSERT INTO inventario_movimientos (
              id_sucursal,
              id_variante,
              id_usuario,
              id_tipo_movimiento,
              cantidad,
              referencia,
              descripcion,
              fecha
            ) VALUES (
              ${contexto.id_sucursal},
              ${Number(
                detalle.id_variante,
              )},
              ${idUsuario},
              ${Number(
                tipoLiberacion[0]
                  .id_tipo_movimiento,
              )},
              ${cantidad},
              ${apartado.codigo_apartado},
              ${`Liberación por cancelación: ${motivo}`},
              NOW()
            )
          `;
        }

        await tx.$executeRaw`
          UPDATE apartados
          SET
            id_estado =
              ${Number(
                estadoCancelado[0].id_estado,
              )},
            observaciones = CONCAT(
              COALESCE(observaciones, ''),
              CASE
                WHEN observaciones IS NULL
                     OR observaciones = ''
                THEN ''
                ELSE ' | '
              END,
              ${`Cancelado: ${motivo}`}
            )
          WHERE id_apartado = ${idApartado}
        `;

        const estadoCuotaCancelada: any[] =
          await tx.$queryRaw`
            SELECT id_estado
            FROM estados_sistema
            WHERE modulo = 'CUOTA'
              AND codigo = 'CANCELADA'
              AND estado = 1
            LIMIT 1
          `;

        if (
          estadoCuotaCancelada.length === 0
        ) {
          throw new BadRequestException(
            'No existe el estado CUOTA/CANCELADA',
          );
        }

        await tx.$executeRaw`
          UPDATE venta_cuotas
          SET id_estado =
              ${Number(
                estadoCuotaCancelada[0].id_estado,
              )}
          WHERE tipo_origen = 'APARTADO'
            AND id_apartado = ${idApartado}
            AND saldo > 0
        `;
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel
            .Serializable,
        timeout: 30000,
      },
    );

    return {
      mensaje: 'Apartado cancelado correctamente',
      apartado: await this.obtener(
        idApartado,
        idUsuario,
      ),
    };
  }

  private async generarDocumentoApartadoTx(
    tx: Prisma.TransactionClient,
    data: {
      idApartado: number;
      codigoApartado: string;
      idCliente: number;
      idUsuario: number;
      idSucursal: number;
      total: number;
      enganche: number;
      idMetodoPago: number;
      detalles: Array<{
        id_variante: number;
        cantidad: number;
        precio_unitario: number;
        descuento: number;
        subtotal: number;
      }>;
    },
  ) {
    const tipo: any[] = await tx.$queryRaw`
      SELECT
        id_tipo_documento,
        prefijo
      FROM tipos_documento
      WHERE codigo = 'VALE'
        AND estado = 1
      LIMIT 1
    `;

    const estado: any[] = await tx.$queryRaw`
      SELECT id_estado
      FROM estados_sistema
      WHERE modulo = 'DOCUMENTO'
        AND codigo = 'EMITIDO'
        AND estado = 1
      LIMIT 1
    `;

    if (
      tipo.length === 0 ||
      estado.length === 0
    ) {
      throw new BadRequestException(
        'No existe la configuración para generar el vale',
      );
    }

    const idTipo = Number(
      tipo[0].id_tipo_documento,
    );

    const codigoDocumento =
      await this.siguienteDocumentoTx(
        tx,
        data.idSucursal,
        idTipo,
        tipo[0].prefijo || 'VAL',
      );

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
        ${idTipo},
        'APARTADO',
        ${data.idApartado},
        ${data.idCliente},
        ${data.idUsuario},
        ${data.idSucursal},
        ${Number(estado[0].id_estado)},
        NOW(),
        ${data.total},
        0,
        ${data.total},
        ${`Vale de ApartadoYA ${data.codigoApartado}`}
      )
    `;

    const resultado: any[] =
      await tx.$queryRaw`
        SELECT LAST_INSERT_ID()
               AS id_documento
      `;

    const idDocumento = Number(
      resultado[0]?.id_documento,
    );

    for (const detalle of data.detalles) {
      const productos: any[] =
        await tx.$queryRaw`
          SELECT
            p.nombre AS producto,
            pv.codigo_variante,
            pv.color,
            pv.medida
          FROM producto_variantes pv
          INNER JOIN productos p
            ON p.id_producto = pv.id_producto
          WHERE pv.id_variante =
                ${detalle.id_variante}
          LIMIT 1
        `;

      const producto = productos[0];

      await tx.$executeRaw`
        INSERT INTO documento_detalle (
          id_documento,
          codigo_item,
          descripcion,
          cantidad,
          precio_unitario,
          descuento,
          subtotal
        ) VALUES (
          ${idDocumento},
          ${producto.codigo_variante},
          ${[
            producto.producto,
            producto.color,
            producto.medida,
          ]
            .filter(Boolean)
            .join(' - ')},
          ${detalle.cantidad},
          ${detalle.precio_unitario},
          ${detalle.descuento},
          ${detalle.subtotal}
        )
      `;
    }

    if (data.enganche > 0) {
      await tx.$executeRaw`
        INSERT INTO documento_pagos (
          id_documento,
          id_metodo_pago,
          monto,
          referencia
        ) VALUES (
          ${idDocumento},
          ${data.idMetodoPago},
          ${data.enganche},
          ${data.codigoApartado}
        )
      `;
    }
  }

  private async generarDocumentoAbonoTx(
    tx: Prisma.TransactionClient,
    data: {
      idPago: number;
      idApartado: number;
      codigoApartado: string;
      idCliente: number;
      idUsuario: number;
      idSucursal: number;
      idMetodoPago: number;
      monto: number;
      nuevoSaldo: number;
    },
  ) {
    const tipo: any[] = await tx.$queryRaw`
      SELECT
        id_tipo_documento,
        prefijo
      FROM tipos_documento
      WHERE codigo =
            'COMPROBANTE_ABONO'
        AND estado = 1
      LIMIT 1
    `;

    const estado: any[] = await tx.$queryRaw`
      SELECT id_estado
      FROM estados_sistema
      WHERE modulo = 'DOCUMENTO'
        AND codigo = 'EMITIDO'
        AND estado = 1
      LIMIT 1
    `;

    if (
      tipo.length === 0 ||
      estado.length === 0
    ) {
      throw new BadRequestException(
        'No existe la configuración del comprobante de abono',
      );
    }

    const idTipo = Number(
      tipo[0].id_tipo_documento,
    );

    const codigoDocumento =
      await this.siguienteDocumentoTx(
        tx,
        data.idSucursal,
        idTipo,
        tipo[0].prefijo || 'ABN',
      );

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
        ${idTipo},
        'PAGO',
        ${data.idPago},
        ${data.idCliente},
        ${data.idUsuario},
        ${data.idSucursal},
        ${Number(estado[0].id_estado)},
        NOW(),
        ${data.monto},
        0,
        ${data.monto},
        ${`Abono al apartado ${data.codigoApartado}. Saldo restante Q${data.nuevoSaldo.toFixed(
          2,
        )}`}
      )
    `;

    const resultado: any[] =
      await tx.$queryRaw`
        SELECT LAST_INSERT_ID()
               AS id_documento
      `;

    const idDocumento = Number(
      resultado[0]?.id_documento,
    );

    await tx.$executeRaw`
      INSERT INTO documento_detalle (
        id_documento,
        codigo_item,
        descripcion,
        cantidad,
        precio_unitario,
        descuento,
        subtotal
      ) VALUES (
        ${idDocumento},
        ${data.codigoApartado},
        'Abono de ApartadoYA',
        1,
        ${data.monto},
        0,
        ${data.monto}
      )
    `;

    await tx.$executeRaw`
      INSERT INTO documento_pagos (
        id_documento,
        id_metodo_pago,
        monto,
        referencia
      ) VALUES (
        ${idDocumento},
        ${data.idMetodoPago},
        ${data.monto},
        ${data.codigoApartado}
      )
    `;
  }

  private async siguienteDocumentoTx(
    tx: Prisma.TransactionClient,
    idSucursal: number,
    idTipoDocumento: number,
    prefijo: string,
  ) {
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
        'No existe una secuencia documental activa',
      );
    }

    const correlativo =
      Number(
        secuencias[0].correlativo_actual,
      ) + 1;

    await tx.$executeRaw`
      UPDATE secuencias_documentos
      SET correlativo_actual =
          ${correlativo}
      WHERE id_secuencia =
            ${Number(
              secuencias[0].id_secuencia,
            )}
    `;

    return `${prefijo}-${
      secuencias[0].serie
    }-${String(correlativo).padStart(
      6,
      '0',
    )}`;
  }

  private manejarError(error: unknown): never {
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
      mensaje.includes(
        'uk_apartados_token_operacion',
      )
    ) {
      throw new BadRequestException(
        'El apartado ya fue procesado',
      );
    }

    if (
      mensaje.includes(
        'uk_pagos_token_operacion',
      )
    ) {
      throw new BadRequestException(
        'El abono ya fue procesado',
      );
    }

    if (
      mensaje.includes(
        'uk_apartado_detalle_variante',
      )
    ) {
      throw new BadRequestException(
        'Una variante está repetida en el apartado',
      );
    }

    if (
      mensaje.includes('chk_apartados') ||
      mensaje.includes(
        'chk_apartado_detalle',
      )
    ) {
      throw new BadRequestException(
        'Los totales o cantidades del apartado son inválidos',
      );
    }

    if (
      mensaje.includes(
        'CUOTAS_YA_GENERADAS',
      )
    ) {
      throw new BadRequestException(
        'El calendario de cuotas ya fue generado',
      );
    }

    if (
      mensaje.includes(
        'PAGO_YA_APLICADO',
      )
    ) {
      throw new BadRequestException(
        'El pago ya fue aplicado a las cuotas',
      );
    }

    if (
      mensaje.includes(
        'PAGO_SUPERA_SALDO',
      )
    ) {
      throw new BadRequestException(
        'El abono supera el saldo pendiente de las cuotas',
      );
    }

    console.error(
      'Error técnico de ApartadoYA:',
      error,
    );

    throw new BadRequestException(
      'No fue posible completar la operación de ApartadoYA',
    );
  }
}