import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const usuarios: any[] = await this.prisma.$queryRaw`
      SELECT 
        id_usuario,
        usuario,
        email,
        password_hash,
        estado
      FROM usuarios
      WHERE email = ${data.email}
        AND estado = 1
      LIMIT 1
    `;

    const usuario = usuarios[0];

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValida = await bcrypt.compare(
      data.password,
      usuario.password_hash,
    );

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

   const payload = {
    sub: Number(usuario.id_usuario),
    id_usuario: Number(usuario.id_usuario),
    usuario: usuario.usuario,
    email: usuario.email,
};

const token = await this.jwtService.signAsync(payload);

    await this.prisma.$executeRaw`
      UPDATE usuarios
      SET ultimo_login = NOW()
      WHERE id_usuario = ${usuario.id_usuario}
    `;

    return {
      mensaje: 'Login correcto',
      usuario: {
        id_usuario: Number(usuario.id_usuario),
        usuario: usuario.usuario,
        email: usuario.email,
      },
      token,
    };
  }

  async obtenerMenu(idUsuario: number) {
    const menu: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT 
        id_modulo,
        codigo,
        nombre,
        ruta,
        icono,
        id_modulo_padre,
        orden_menu
      FROM vw_menu_usuario
      WHERE id_usuario = ?
      ORDER BY orden_menu ASC
      `,
      idUsuario,
    );

    const roles: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT 
        r.id_rol,
        r.codigo_rol,
        r.nombre
      FROM usuario_rol ur
      INNER JOIN roles r ON ur.id_rol = r.id_rol
      WHERE ur.id_usuario = ?
        AND r.estado = 1
      `,
      idUsuario,
    );

    return {
      id_usuario: Number(idUsuario),
      roles: roles.map((rol) => ({
        id_rol: Number(rol.id_rol),
        codigo_rol: rol.codigo_rol,
        nombre: rol.nombre,
      })),
      menu: menu.map((item) => ({
        id_modulo: Number(item.id_modulo),
        codigo: item.codigo,
        nombre: item.nombre,
        ruta: item.ruta,
        icono: item.icono,
        id_modulo_padre: item.id_modulo_padre
          ? Number(item.id_modulo_padre)
          : null,
        orden_menu: Number(item.orden_menu),
      })),
    };
  }
}