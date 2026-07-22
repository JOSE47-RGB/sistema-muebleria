export class CreateApartadoDetalleDto {
  id_variante!: number;
  cantidad!: number;
}

export class CreateApartadoDto {
  token_operacion!: string;

  id_cliente!: number;
  id_metodo_pago!: number;

  enganche!: number;
  fecha_limite?: string | null;
  referencia_pago?: string | null;
  observaciones?: string | null;

  detalles!: CreateApartadoDetalleDto[];
}