export class CreateProveedorDto {
  id_tipo_proveedor!: number;
  codigo_proveedor!: string;
  nombre!: string;
  telefono?: string;
  direccion?: string;
}