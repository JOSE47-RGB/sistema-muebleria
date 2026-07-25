import { useRef } from "react";

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

  const coincidencia = fecha.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  );

  if (coincidencia) {
    const [, anio, mes, dia] = coincidencia;

    const valorLocal = new Date(
      Number(anio),
      Number(mes) - 1,
      Number(dia),
    );

    if (!Number.isNaN(valorLocal.getTime())) {
      return valorLocal.toLocaleDateString("es-GT");
    }
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return fecha;
  }

  return valor.toLocaleDateString("es-GT");
};

const obtenerEstilosDocumento = () => {
  const enlaces = Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"]',
    ),
  )
    .map(
      (enlace) =>
        `<link rel="stylesheet" href="${enlace.href}" />`,
    )
    .join("\n");

  const estilos = Array.from(
    document.querySelectorAll<HTMLStyleElement>(
      "style",
    ),
  )
    .map((estilo) => estilo.outerHTML)
    .join("\n");

  return `${enlaces}\n${estilos}`;
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
  const reciboRef = useRef<HTMLElement>(null);

  const imprimir = () => {
    const recibo = reciboRef.current;

    if (!recibo) {
      alert(
        "No fue posible preparar el vale para imprimir.",
      );
      return;
    }

    const ventanaImpresion = window.open(
      "",
      "_blank",
      "width=1000,height=900,scrollbars=yes",
    );

    if (!ventanaImpresion) {
      alert(
        "El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio.",
      );
      return;
    }

    const estilosDocumento =
      obtenerEstilosDocumento();

    const contenidoRecibo = recibo.outerHTML;

    ventanaImpresion.document.open();
    ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Vale ${codigoApartado}</title>

          ${estilosDocumento}

          <style>
            @page {
              size: letter portrait;
              margin: 5mm;
            }

            html,
            body {
              width: 100%;
              margin: 0;
              padding: 0;
              background: #ffffff !important;
              color: #0f172a;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            *,
            *::before,
            *::after {
              box-sizing: border-box;
            }

            #pagina-impresion {
              width: 200mm;
              max-width: 200mm;
              margin: 0 auto;
              overflow: hidden;
              background: #ffffff;
            }

            #recibo-apartado {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 4mm !important;
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
              color: #0f172a !important;
              font-size: 10px !important;
              line-height: 1.25 !important;
            }

            #recibo-apartado header {
              padding-bottom: 2.5mm !important;
            }

            #recibo-apartado header h1 {
              margin: 0 !important;
              font-size: 19px !important;
              line-height: 1.15 !important;
            }

            #recibo-apartado header p {
              margin-top: 1mm !important;
              margin-bottom: 0 !important;
            }

            #recibo-apartado section {
              margin-top: 3mm !important;
            }

            #recibo-apartado h2 {
              margin-top: 0 !important;
              margin-bottom: 1.5mm !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
            }

            #recibo-apartado p {
              margin-top: 0 !important;
              margin-bottom: 0 !important;
            }

            #recibo-apartado .grid {
              gap: 2mm 4mm !important;
            }

            #recibo-apartado .space-y-2 > :not([hidden]) ~ :not([hidden]) {
              margin-top: 1.2mm !important;
            }

            #recibo-apartado .rounded-xl {
              border-radius: 2mm !important;
            }

            #recibo-apartado section > .rounded-xl,
            #recibo-apartado section > div > .rounded-xl {
              padding: 2.5mm !important;
            }

            #recibo-apartado .overflow-x-auto {
              overflow: visible !important;
            }

            #recibo-apartado table {
              width: 100% !important;
              margin: 0 !important;
              border-collapse: collapse !important;
              table-layout: auto !important;
              font-size: 8.5px !important;
              line-height: 1.15 !important;
            }

            #recibo-apartado th,
            #recibo-apartado td {
              padding: 1.1mm 1mm !important;
              vertical-align: top !important;
            }

            #recibo-apartado footer {
              margin-top: 3mm !important;
              padding-top: 2mm !important;
              font-size: 8px !important;
            }

            #recibo-apartado header,
            #recibo-apartado section,
            #recibo-apartado footer,
            #recibo-apartado table,
            #recibo-apartado thead,
            #recibo-apartado tbody,
            #recibo-apartado tr,
            #recibo-apartado th,
            #recibo-apartado td {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }

            button,
            .no-imprimir,
            .print\\:hidden {
              display: none !important;
            }

            @media print {
              html,
              body {
                width: 210mm;
                min-height: 0;
                overflow: visible !important;
              }

              #pagina-impresion {
                width: 200mm;
                max-width: 200mm;
                min-height: 0;
                margin: 0 auto;
              }
            }
          </style>
        </head>

        <body>
          <main id="pagina-impresion">
            ${contenidoRecibo}
          </main>

          <script>
            (function () {
              function prepararImpresion() {
                const pagina = document.getElementById(
                  "pagina-impresion",
                );

                const recibo = document.getElementById(
                  "recibo-apartado",
                );

                if (!pagina || !recibo) {
                  window.close();
                  return;
                }

                recibo.style.transform = "none";
                recibo.style.transformOrigin = "top center";

                const milimetrosAPixeles = 96 / 25.4;
                const altoUtilPagina = 269 * milimetrosAPixeles;
                const altoRecibo = recibo.scrollHeight;

                const escala = Math.min(
                  1,
                  altoUtilPagina / Math.max(altoRecibo, 1),
                );

                if (escala < 1) {
                  recibo.style.transform =
                    "scale(" + escala + ")";

                  recibo.style.transformOrigin =
                    "top center";

                  pagina.style.height =
                    altoRecibo * escala + "px";
                }

                window.setTimeout(function () {
                  window.focus();
                  window.print();
                }, 300);
              }

              if (document.readyState === "complete") {
                window.setTimeout(
                  prepararImpresion,
                  300,
                );
              } else {
                window.addEventListener(
                  "load",
                  function () {
                    window.setTimeout(
                      prepararImpresion,
                      300,
                    );
                  },
                  { once: true },
                );
              }

              window.addEventListener(
                "afterprint",
                function () {
                  window.close();
                },
                { once: true },
              );
            })();
          <\/script>
        </body>
      </html>
    `);

    ventanaImpresion.document.close();
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
        ref={reciboRef}
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
                  <tr
                    key={`${detalle.codigo_variante}-${detalle.codigo_producto}`}
                  >
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
                  {formatoMoneda(saldoPendiente)}
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