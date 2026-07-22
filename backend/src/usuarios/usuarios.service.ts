import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const usuarios: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        u.id_usuario,
        u.usuario,
        u.email,
        u.estado,
        e.id_empleado,
        e.codigo_empleado,
        e.dpi,
        CONCAT(e.nombres,' ',e.apellidos) AS empleado,
        r.id_rol,
        r.codigo_rol,
        r.nombre AS rol
      FROM usuarios u
      INNER JOIN empleados e ON e.id_empleado = u.id_empleado
      INNER JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
      INNER JOIN roles r ON r.id_rol = ur.id_rol
      ORDER BY u.id_usuario DESC
    `);

    return usuarios.map((u) => ({
      ...u,
      id_usuario: Number(u.id_usuario),
      id_empleado: Number(u.id_empleado),
      id_rol: Number(u.id_rol),
    }));
  }

  async obtener(id: number) {
    const datos: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT
        u.id_usuario,
        u.usuario,
        u.email,
        u.estado,
        e.id_empleado,
        e.codigo_empleado,
        e.dpi,
        e.nombres,
        e.apellidos,
        e.telefono,
        e.direccion,
        e.puesto
      FROM usuarios u
      INNER JOIN empleados e ON e.id_empleado = u.id_empleado
      WHERE u.id_usuario = ?
      `,
      id,
    );

    if (datos.length === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      ...datos[0],
      id_usuario: Number(datos[0].id_usuario),
      id_empleado: Number(datos[0].id_empleado),
    };
  }

  async crear(data: CreateUsuarioDto) {
    const existeEmpleado: any[] = await this.prisma.$queryRaw`
      SELECT id_empleado FROM empleados
      WHERE codigo_empleado = ${data.codigo_empleado}
         OR dpi = ${data.dpi}
      LIMIT 1
    `;

    if (existeEmpleado.length > 0) {
      throw new BadRequestException('El código de empleado o DPI ya existe');
    }

    const existeUsuario: any[] = await this.prisma.$queryRaw`
      SELECT id_usuario FROM usuarios
      WHERE usuario = ${data.usuario}
         OR email = ${data.email}
      LIMIT 1
    `;

    if (existeUsuario.length > 0) {
      throw new BadRequestException('El usuario o correo ya existe');
    }

    const existeSucursal: any[] = await this.prisma.$queryRaw`
      SELECT id_sucursal FROM sucursales
      WHERE id_sucursal = ${data.id_sucursal}
        AND estado = 1
      LIMIT 1
    `;

    if (existeSucursal.length === 0) {
      throw new BadRequestException('La sucursal seleccionada no existe');
    }

    const existeRol: any[] = await this.prisma.$queryRaw`
      SELECT id_rol FROM roles
      WHERE id_rol = ${data.id_rol}
        AND estado = 1
      LIMIT 1
    `;

    if (existeRol.length === 0) {
      throw new BadRequestException('El rol seleccionado no existe');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO empleados (
          codigo_empleado,
          id_sucursal,
          nombres,
          apellidos,
          dpi,
          telefono,
          direccion,
          puesto,
          estado
        ) VALUES (
          ${data.codigo_empleado},
          ${data.id_sucursal},
          ${data.nombres},
          ${data.apellidos},
          ${data.dpi},
          ${data.telefono || null},
          ${data.direccion || null},
          ${data.puesto || null},
          1
        )
      `;

      const empleadoCreado: any[] = await tx.$queryRaw`
        SELECT id_empleado
        FROM empleados
        WHERE codigo_empleado = ${data.codigo_empleado}
        LIMIT 1
      `;

      const idEmpleado = empleadoCreado[0].id_empleado;

      await tx.$executeRaw`
        INSERT INTO usuarios (
          id_empleado,
          usuario,
          email,
          password_hash,
          estado
        ) VALUES (
          ${idEmpleado},
          ${data.usuario},
          ${data.email},
          ${passwordHash},
          1
        )
      `;

      const usuarioCreado: any[] = await tx.$queryRaw`
        SELECT id_usuario
        FROM usuarios
        WHERE email = ${data.email}
        LIMIT 1
      `;

      const idUsuario = usuarioCreado[0].id_usuario;

      await tx.$executeRaw`
        INSERT INTO usuario_rol (
          id_usuario,
          id_rol
        ) VALUES (
          ${idUsuario},
          ${data.id_rol}
        )
      `;

      return {
        mensaje: 'Usuario creado correctamente',
        usuario: {
          id_usuario: Number(idUsuario),
          id_empleado: Number(idEmpleado),
          usuario: data.usuario,
          email: data.email,
          id_rol: Number(data.id_rol),
        },
      };
    });
  }
}