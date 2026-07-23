type Props = {
  codigoApartado: string;
  cliente: {
    codigo: string;
    nombre: string;
    nit?: string | null;
    telefono?: string | null;
  };
  fecha: string;
  metodoPago: string;
  referencia?: string | null;
  monto: number;
  saldoAnterior: number;
  saldoNuevo: number;
  usuario?: string;
  sucursal?: string;
};

const formatoMoneda = (valor: number) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));

const formatoFechaHora = (fecha: string) => {
  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleString("es-GT");
};

export default function ReciboAbono({
  codigoApartado,
  cliente,
  fecha,
  metodoPago,
  referencia,
  monto,
  saldoAnterior,
  saldoNuevo,
  usuario,
  sucursal,
}: Props) {
  const imprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="print:hidden flex justify-end">
        <button
          type="button"
          onClick={imprimir}
          className="rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      <article
        id="recibo-abono"
        className="mx-auto max-w-xl rounded-xl bg-white p-6 text-slate-900 shadow"
      >
        <header className="border-b pb-4 text-center">
          <h1 className="text-2xl font-bold">
            ROBLES MADERA
          </h1>

          <p className="mt-1 text-sm">
            Recibo de abono ApartadoYA
          </p>

          <p className="mt-2 text-lg font-bold">
            {codigoApartado}
          </p>
        </header>

        <section className="mt-5 space-y-2 text-sm">
          <div>
            <span className="font-semibold">
              Fecha:
            </span>{" "}
            {formatoFechaHora(fecha)}
          </div>

          <div>
            <span className="font-semibold">
              Cliente:
            </span>{" "}
            {cliente.nombre}
          </div>

          <div>
            <span className="font-semibold">
              Código cliente:
            </span>{" "}
            {cliente.codigo}
          </div>

          <div>
            <span className="font-semibold">
              NIT:
            </span>{" "}
            {cliente.nit || "C/F"}
          </div>

          <div>
            <span className="font-semibold">
              Teléfono:
            </span>{" "}
            {cliente.telefono || "-"}
          </div>

          <div>
            <span className="font-semibold">
              Método de pago:
            </span>{" "}
            {metodoPago}
          </div>

          <div>
            <span className="font-semibold">
              Referencia:
            </span>{" "}
            {referencia || "-"}
          </div>

          {sucursal && (
            <div>
              <span className="font-semibold">
                Sucursal:
              </span>{" "}
              {sucursal}
            </div>
          )}

          {usuario && (
            <div>
              <span className="font-semibold">
                Registrado por:
              </span>{" "}
              {usuario}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border p-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Saldo anterior</span>
              <strong>
                {formatoMoneda(saldoAnterior)}
              </strong>
            </div>

            <div className="flex justify-between text-green-700">
              <span>Abono recibido</span>
              <strong>
                {formatoMoneda(monto)}
              </strong>
            </div>

            <div className="flex justify-between border-t pt-3 text-lg">
              <span>Nuevo saldo</span>
              <strong>
                {formatoMoneda(saldoNuevo)}
              </strong>
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t pt-4 text-center text-xs text-slate-500">
          <p>
            Gracias por su pago.
          </p>

          <p className="mt-1">
            Conserve este recibo como comprobante.
          </p>
        </footer>
      </article>
    </div>
  );
}