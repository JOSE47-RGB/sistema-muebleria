export class CreateProductoDto {
  codigo_producto!: string;
  id_categoria!: number;
  id_marca?: number;
  nombre!: string;
  descripcion?: string;

  codigo_variante!: string;
  id_unidad_medida?: number;
  color?: string;
  material?: string;
  medida?: string;
  precio_venta!: number;
}