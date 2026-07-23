type DetalleProducto = {
  codigo_producto: string;
  producto: string;
  codigo_variante: string;
  color?: string | null;
  material?: string | null;
  medida?: string | null;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
};

type CuotaApartado = {
  numero_cuota: number;
  fecha_vencimiento: string;
  monto_programado: number;
  monto_pagado: number;
  saldo: number;
  estado_calculado: string;
};

type Props = {
  codigoApartado: string;
  fechaApartado: string;
  cliente: {
    codigo: string;
    nombre: string;
    nit?: string | null;
    telefono?: string | null;
    direccion?: string | null;
  };
  sucursal: string;
  usuario: string;
  total: number;
  enganche: number;
  saldoPendiente: number;
  cantidadCuotas?: number | null;
  frecuenciaPago?: string | null;
  fechaPrimerPago?: string | null;
  detalles: DetalleProducto[];
  cuotas?: CuotaApartado[];
};

const formatoMoneda = (valor: number) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));

const formatoFecha = (fecha?: string | null) => {
  if (!fecha) {
    return "-";
  }

  const valor = fecha.includes("T")
    ? new Date(fecha)
    : new Date(`${fecha}T00:00:00`);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleDateString("es-GT");
};

export default function ReciboApartado({
  codigoApartado,
  fechaApartado,
  cliente,
  sucursal,
  usuario,
  total,
  enganche,
  saldoPendiente,
  cantidadCuotas,
  frecuenciaPago,
  fechaPrimerPago,
  detalles,
  cuotas = [],
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
        id="recibo-apartado"
        className="mx-auto max-w-4xl rounded-xl bg-white p-6 text-slate-900 shadow"
      >
        <header className="border-b pb-4 text-center">
          <h1 className="text-2xl font-bold">
            ROBLES MADERA
          </h1>

          <p className="mt-1 text-sm">
            Vale de ApartadoYA
          </p>

          <p className="mt-2 text-lg font-bold">
            {codigoApartado}
          </p>
        </header>

        <section className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <div>
            <span className="font-semibold">
              Fecha:
            </span>{" "}
            {formatoFecha(fechaApartado)}
          </div>

          <div>
            <span className="font-semibold">
              Sucursal:
            </span>{" "}
            {sucursal}
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

          <div className="md:col-span-2">
            <span className="font-semibold">
              Dirección:
            </span>{" "}
            {cliente.direccion || "-"}
          </div>

          <div>
            <span className="font-semibold">
              Registrado por:
            </span>{" "}
            {usuario}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold">
            Productos apartados
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-2 text-left">
                    Producto
                  </th>
                  <th className="border px-2 py-2 text-right">
                    Cantidad
                  </th>
                  <th className="border px-2 py-2 text-right">
                    Precio
                  </th>
                  <th className="border px-2 py-2 text-right">
                    Subtotal
                  </th>
                </tr>
              </thead>

              <tbody>
                {detalles.map((detalle) => (
                  <tr key={`${detalle.codigo_variante}-${detalle.codigo_producto}`}>
                    <td className="border px-2 py-2">
                      <p className="font-semibold">
                        {detalle.producto}
                      </p>

                      <p className="text-xs text-slate-500">
                        {detalle.codigo_producto} /{" "}
                        {detalle.codigo_variante}
                      </p>

                      <p className="text-xs text-slate-500">
                        {[
                          detalle.color,
                          detalle.material,
                          detalle.medida,
                        ]
                          .filter(Boolean)
                          .join(" - ")}
                      </p>
                    </td>

                    <td className="border px-2 py-2 text-right">
                      {detalle.cantidad}
                    </td>

                    <td className="border px-2 py-2 text-right">
                      {formatoMoneda(
                        detalle.precio_unitario,
                      )}
                    </td>

                    <td className="border px-2 py-2 text-right">
                      {formatoMoneda(detalle.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <h2 className="font-bold">
              Plan de pagos
            </h2>

            <div className="mt-3 space-y-2 text-sm">
              <p>
                <span className="font-semibold">
                  Cuotas:
                </span>{" "}
                {cantidadCuotas || "-"}
              </p>

              <p>
                <span className="font-semibold">
                  Frecuencia:
                </span>{" "}
                {frecuenciaPago || "-"}
              </p>

              <p>
                <span className="font-semibold">
                  Primer pago:
                </span>{" "}
                {formatoFecha(fechaPrimerPago)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total</span>
                <strong>
                  {formatoMoneda(total)}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Enganche</span>
                <strong>
                  {formatoMoneda(enganche)}
                </strong>
              </div>

              <div className="flex justify-between border-t pt-2 text-base">
                <span>Saldo pendiente</span>
                <strong>
                  {formatoMoneda(
                    saldoPendiente,
                  )}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {cuotas.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-lg font-bold">
              Calendario de cuotas
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-2">
                      Cuota
                    </th>
                    <th className="border px-2 py-2">
                      Vencimiento
                    </th>
                    <th className="border px-2 py-2 text-right">
                      Programado
                    </th>
                    <th className="border px-2 py-2 text-right">
                      Pagado
                    </th>
                    <th className="border px-2 py-2 text-right">
                      Saldo
                    </th>
                    <th className="border px-2 py-2">
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {cuotas.map((cuota) => (
                    <tr key={cuota.numero_cuota}>
                      <td className="border px-2 py-2 text-center">
                        {cuota.numero_cuota}
                      </td>

                      <td className="border px-2 py-2">
                        {formatoFecha(
                          cuota.fecha_vencimiento,
                        )}
                      </td>

                      <td className="border px-2 py-2 text-right">
                        {formatoMoneda(
                          cuota.monto_programado,
                        )}
                      </td>

                      <td className="border px-2 py-2 text-right">
                        {formatoMoneda(
                          cuota.monto_pagado,
                        )}
                      </td>

                      <td className="border px-2 py-2 text-right">
                        {formatoMoneda(cuota.saldo)}
                      </td>

                      <td className="border px-2 py-2 text-center">
                        {cuota.estado_calculado}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <footer className="mt-8 border-t pt-4 text-center text-xs text-slate-500">
          <p>
            Este documento es un comprobante de apartado.
          </p>

          <p className="mt-1">
            Los productos podrán entregarse según las condiciones establecidas por la empresa.
          </p>
        </footer>
      </article>
    </div>
  );
}