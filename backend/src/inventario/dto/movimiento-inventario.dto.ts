export class MovimientoInventarioDto {
  id_sucursal!: number;
  id_variante!: number;
  cantidad!: number;
  referencia?: string;
  descripcion?: string;
  stock_minimo?: number;
}