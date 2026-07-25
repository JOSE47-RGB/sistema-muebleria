export class CancelarApartadoDto {
  /**
   * Razón principal por la que se cancela el apartado.
   * El backend validará que tenga al menos 5 caracteres.
   */
  motivo!: string;

  /**
   * Información adicional opcional.
   * Ejemplo: cliente solicita devolución en efectivo.
   */
  observaciones?: string | null;
}