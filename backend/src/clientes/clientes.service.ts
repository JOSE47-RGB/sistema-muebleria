import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async listarTiposCliente() {
    const tipos: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        id_tipo_cliente,
        codigo,
        nombre,
        porcentaje_descuento,
        estado
      FROM tipos_cliente
      WHERE estado = 1
      ORDER BY nombre ASC
    `);

    return tipos.map((tipo) => ({
      id_tipo_cliente: Number(tipo.id_tipo_cliente),
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      porcentaje_descuento: Number(
        tipo.porcentaje_descuento,
      ),
      estado: Number(tipo.estado),
    }));
  }

  async listar() {
    const clientes: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        c.id_cliente,
        c.codigo_cliente,
        c.id_tipo_cliente,
        tc.codigo AS codigo_tipo_cliente,
        tc.nombre AS tipo_cliente,
        tc.porcentaje_descuento,
        c.nombres,
        c.apellidos,
        TRIM(
          CONCAT(
            c.nombres,
            ' ',
            COALESCE(c.apellidos, '')
          )
        ) AS cliente,
        c.telefono,
        c.nit,
        c.dpi,
        c.direccion,
        c.observaciones,
        c.estado,
        COALESCE(ce.total_compras, 0) AS total_compras,
        COALESCE(ce.cantidad_compras, 0) AS cantidad_compras,
        ce.ultima_compra,
        COALESCE(ce.total_abonos, 0) AS total_abonos,
        COALESCE(ce.cantidad_abonos, 0) AS cantidad_abonos
      FROM clientes c
      INNER JOIN tipos_cliente tc
        ON tc.id_tipo_cliente = c.id_tipo_cliente
      LEFT JOIN cliente_estadisticas ce
        ON ce.id_cliente = c.id_cliente
      ORDER BY c.id_cliente DESC
    `);

    return clientes.map((cliente) => ({
      id_cliente: Number(cliente.id_cliente),
      codigo_cliente: cliente.codigo_cliente,
      id_tipo_cliente: Number(cliente.id_tipo_cliente),
      codigo_tipo_cliente: cliente.codigo_tipo_cliente,
      tipo_cliente: cliente.tipo_cliente,
      porcentaje_descuento: Number(
        cliente.porcentaje_descuento,
      ),
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      cliente: cliente.cliente,
      telefono: cliente.telefono,
      nit: cliente.nit,
      dpi: cliente.dpi,
      direccion: cliente.direccion,
      observaciones: cliente.observaciones,
      estado: Number(cliente.estado),
      total_compras: Number(cliente.total_compras),
      cantidad_compras: Number(cliente.cantidad_compras),
      ultima_compra: cliente.ultima_compra,
      total_abonos: Number(cliente.total_abonos),
      cantidad_abonos: Number(cliente.cantidad_abonos),
    }));
  }

  async obtener(id: number) {
    this.validarId(id);

    const clientes: any[] = await this.prisma.$queryRaw`
      SELECT
        c.id_cliente,
        c.codigo_cliente,
        c.id_tipo_cliente,
        tc.codigo AS codigo_tipo_cliente,
        tc.nombre AS tipo_cliente,
        tc.porcentaje_descuento,
        c.nombres,
        c.apellidos,
        TRIM(
          CONCAT(
            c.nombres,
            ' ',
            COALESCE(c.apellidos, '')
          )
        ) AS cliente,
        c.telefono,
        c.nit,
        c.dpi,
        c.direccion,
        c.observaciones,
        c.estado,
        COALESCE(ce.total_compras, 0) AS total_compras,
        COALESCE(ce.cantidad_compras, 0) AS cantidad_compras,
        ce.ultima_compra,
        COALESCE(ce.total_abonos, 0) AS total_abonos,
        COALESCE(ce.cantidad_abonos, 0) AS cantidad_abonos
      FROM clientes c
      INNER JOIN tipos_cliente tc
        ON tc.id_tipo_cliente = c.id_tipo_cliente
      LEFT JOIN cliente_estadisticas ce
        ON ce.id_cliente = c.id_cliente
      WHERE c.id_cliente = ${id}
      LIMIT 1
    `;

    if (clientes.length === 0) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const cliente = clientes[0];

    return {
      id_cliente: Number(cliente.id_cliente),
      codigo_cliente: cliente.codigo_cliente,
      id_tipo_cliente: Number(cliente.id_tipo_cliente),
      codigo_tipo_cliente: cliente.codigo_tipo_cliente,
      tipo_cliente: cliente.tipo_cliente,
      porcentaje_descuento: Number(
        cliente.porcentaje_descuento,
      ),
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      cliente: cliente.cliente,
      telefono: cliente.telefono,
      nit: cliente.nit,
      dpi: cliente.dpi,
      direccion: cliente.direccion,
      observaciones: cliente.observaciones,
      estado: Number(cliente.estado),
      total_compras: Number(cliente.total_compras),
      cantidad_compras: Number(cliente.cantidad_compras),
      ultima_compra: cliente.ultima_compra,
      total_abonos: Number(cliente.total_abonos),
      cantidad_abonos: Number(cliente.cantidad_abonos),
    };
  }

  async crear(data: CreateClienteDto) {
    const idTipoCliente = Number(data.id_tipo_cliente);

    const nombres = data.nombres?.trim();
    const apellidos = data.apellidos?.trim() || null;
    const telefono = data.telefono?.trim() || null;
    const direccion = data.direccion?.trim() || null;
    const observaciones =
      data.observaciones?.trim() || null;

    const nitRecibido = data.nit
      ?.trim()
      .toUpperCase()
      .replace(/\s+/g, '');

    const dpiRecibido = data.dpi
      ?.trim()
      .replace(/\s+/g, '');

    /*
     * C/F no identifica de forma única a un cliente.
     * Se guarda como NULL para permitir varios consumidores finales.
     */
    const nit =
      nitRecibido &&
      !['CF', 'C/F'].includes(nitRecibido)
        ? nitRecibido
        : null;

    const dpi = dpiRecibido || null;

    if (!nombres) {
      throw new BadRequestException(
        'Los nombres del cliente son obligatorios',
      );
    }

    if (
      !Number.isInteger(idTipoCliente) ||
      idTipoCliente <= 0
    ) {
      throw new BadRequestException(
        'El tipo de cliente es inválido',
      );
    }

    const tipos: any[] = await this.prisma.$queryRaw`
      SELECT id_tipo_cliente
      FROM tipos_cliente
      WHERE id_tipo_cliente = ${idTipoCliente}
        AND estado = 1
      LIMIT 1
    `;

    if (tipos.length === 0) {
      throw new BadRequestException(
        'El tipo de cliente no existe o está inactivo',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        /*
         * codigo_cliente es NOT NULL y UNIQUE.
         * Se usa un valor temporal irrepetible mientras MariaDB
         * genera el id_cliente AUTO_INCREMENT.
         */
        const codigoTemporal = `TMP-${randomUUID()}`;

        await tx.$executeRaw`
          INSERT INTO clientes (
            codigo_cliente,
            id_tipo_cliente,
            nombres,
            apellidos,
            telefono,
            nit,
            dpi,
            direccion,
            observaciones,
            estado
          ) VALUES (
            ${codigoTemporal},
            ${idTipoCliente},
            ${nombres},
            ${apellidos},
            ${telefono},
            ${nit},
            ${dpi},
            ${direccion},
            ${observaciones},
            1
          )
        `;

        const resultadoId: any[] = await tx.$queryRaw`
          SELECT LAST_INSERT_ID() AS id_cliente
        `;

        const idCliente = Number(
          resultadoId[0]?.id_cliente,
        );

        if (
          !Number.isInteger(idCliente) ||
          idCliente <= 0
        ) {
          throw new BadRequestException(
            'No fue posible obtener el identificador del cliente',
          );
        }

        const codigoCliente =
          `CLI${String(idCliente).padStart(6, '0')}`;

        await tx.$executeRaw`
          UPDATE clientes
          SET codigo_cliente = ${codigoCliente}
          WHERE id_cliente = ${idCliente}
        `;

        /*
         * INSERT IGNORE evita error si un trigger o proceso anterior
         * ya creó la fila de estadísticas.
         */
        await tx.$executeRaw`
          INSERT IGNORE INTO cliente_estadisticas (
            id_cliente,
            total_compras,
            cantidad_compras,
            ultima_compra,
            total_abonos,
            cantidad_abonos
          ) VALUES (
            ${idCliente},
            0,
            0,
            NULL,
            0,
            0
          )
        `;

        return {
          mensaje: 'Cliente creado correctamente',
          cliente: {
            id_cliente: idCliente,
            codigo_cliente: codigoCliente,
            id_tipo_cliente: idTipoCliente,
            nombres,
            apellidos,
            telefono,
            nit,
            dpi,
            direccion,
            observaciones,
            estado: 1,
          },
        };
      });
    } catch (error: unknown) {
      this.manejarErrorCreacion(error);
    }
  }

  async desactivar(id: number) {
    this.validarId(id);

    const cliente = await this.obtener(id);

    if (cliente.estado === 0) {
      return {
        mensaje: 'El cliente ya se encuentra inactivo',
        id_cliente: id,
      };
    }

    await this.prisma.$executeRaw`
      UPDATE clientes
      SET estado = 0
      WHERE id_cliente = ${id}
    `;

    return {
      mensaje: 'Cliente desactivado correctamente',
      id_cliente: id,
    };
  }

  async activar(id: number) {
    this.validarId(id);

    const cliente = await this.obtener(id);

    if (cliente.estado === 1) {
      return {
        mensaje: 'El cliente ya se encuentra activo',
        id_cliente: id,
      };
    }

    await this.prisma.$executeRaw`
      UPDATE clientes
      SET estado = 1
      WHERE id_cliente = ${id}
    `;

    return {
      mensaje: 'Cliente activado correctamente',
      id_cliente: id,
    };
  }

  private validarId(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(
        'Identificador de cliente inválido',
      );
    }
  }

  private manejarErrorCreacion(error: unknown): never {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    const errorPrisma = error as {
      code?: string;
      message?: string;
      meta?: {
        code?: string;
        message?: string;
      };
    };

    const mensajeTecnico = String(
      errorPrisma.meta?.message ||
        errorPrisma.message ||
        '',
    );

    /*
     * En consultas RAW Prisma suele devolver:
     * P2010 + código MariaDB 1062.
     */
    const esDuplicado =
      errorPrisma.code === 'P2010' ||
      errorPrisma.meta?.code === '1062' ||
      mensajeTecnico.includes('Duplicate entry');

    if (esDuplicado) {
      if (
        mensajeTecnico.includes('uk_clientes_nit') ||
        mensajeTecnico
          .toLowerCase()
          .includes('clientes.nit') ||
        mensajeTecnico
          .toLowerCase()
          .includes('key \'nit\'') ||
        mensajeTecnico
          .toLowerCase()
          .includes('key `nit`')
      ) {
        throw new BadRequestException(
          'Ya existe un cliente registrado con ese NIT',
        );
      }

      if (
        mensajeTecnico.includes('uk_clientes_dpi') ||
        mensajeTecnico
          .toLowerCase()
          .includes('clientes.dpi') ||
        mensajeTecnico
          .toLowerCase()
          .includes('key \'dpi\'') ||
        mensajeTecnico
          .toLowerCase()
          .includes('key `dpi`')
      ) {
        throw new BadRequestException(
          'Ya existe un cliente registrado con ese DPI',
        );
      }

      if (
        mensajeTecnico
          .toLowerCase()
          .includes('codigo_cliente')
      ) {
        throw new BadRequestException(
          'No fue posible generar un código único para el cliente',
        );
      }

      throw new BadRequestException(
        'Ya existe un cliente con los datos ingresados',
      );
    }

    console.error(
      'Error técnico al crear cliente:',
      error,
    );

    throw new BadRequestException(
      'No fue posible registrar el cliente',
    );
  }
}