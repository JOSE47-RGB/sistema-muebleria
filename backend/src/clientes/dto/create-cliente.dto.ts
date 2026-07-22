export class CreateClienteDto {
  id_tipo_cliente!: number;
  nombres!: string;
  apellidos?: string | null;
  telefono?: string | null;
  nit?: string | null;
  dpi?: string | null;
  direccion?: string | null;
  observaciones?: string | null;
}