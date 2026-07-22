export class RegistrarAbonoDto {
  token_operacion!: string;

  id_metodo_pago!: number;
  monto!: number;

  referencia?: string | null;
  observaciones?: string | null;
}