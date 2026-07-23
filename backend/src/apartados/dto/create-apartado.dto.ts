export type FrecuenciaPagoApartado =
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL';

export class CreateApartadoDetalleDto {
  id_variante!: number;
  cantidad!: number;
}

export class CreateApartadoDto {
  token_operacion!: string;

  id_cliente!: number;
  id_metodo_pago!: number;

  enganche!: number;

  cantidad_cuotas!: number;
  frecuencia_pago!: FrecuenciaPagoApartado;
  fecha_primer_pago!: string;

  referencia_pago?: string | null;
  observaciones?: string | null;

  detalles!: CreateApartadoDetalleDto[];
}