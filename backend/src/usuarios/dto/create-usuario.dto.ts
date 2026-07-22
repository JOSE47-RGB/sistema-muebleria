export class CreateUsuarioDto {
  codigo_empleado!: string;
  id_sucursal!: number;
  nombres!: string;
  apellidos!: string;
  dpi!: string;
  telefono?: string;
  direccion?: string;
  puesto?: string;

  usuario!: string;
  email!: string;
  password!: string;
  id_rol!: number;
}