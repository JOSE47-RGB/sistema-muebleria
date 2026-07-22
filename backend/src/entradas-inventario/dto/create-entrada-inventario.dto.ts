export class CreateEntradaInventarioDto {
  id_sucursal!: number;
  id_variante!: number;
  id_proveedor?: number;
  cantidad!: number;
  referencia?: string;
  descripcion?: string;
  stock_minimo?: number;
}