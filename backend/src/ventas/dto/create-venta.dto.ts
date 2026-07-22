export class VentaDetalleDto {
  id_variante!: number;
  cantidad!: number;
}

export class CreateVentaDto {
  token_operacion!: string;
  id_cliente!: number;
  id_metodo_pago!: number;
  monto_pagado!: number;
  observaciones?: string | null;
  detalles!: VentaDetalleDto[];
}