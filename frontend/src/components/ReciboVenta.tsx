export type DocumentoVenta = {
  id_documento: number;
  codigo_documento: string;
  tipo_documento: string;
  codigo_venta: string | null;
  fecha: string;
  subtotal: number;
  descuento: number;
  total: number;
  vendedor: string;

  cliente: {
    nombre: string;
    nit: string | null;
    telefono: string | null;
    direccion: string | null;
  };

  sucursal: {
    codigo: string;
    nombre: string;
    telefono: string | null;
    direccion: string | null;
  };

  detalles: Array<{
    id_documento_detalle: number;
    codigo_item: string | null;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
  }>;

  pagos: Array<{
    id_documento_pago: number;
    id_metodo_pago: number;
    codigo_metodo: string;
    metodo_pago: string;
    monto: number;
    referencia: string | null;
  }>;
};

type Props = {
  documento: DocumentoVenta;
  montoRecibido?: number;
  cambio?: number;
};

const moneda = (valor: number) =>
  `Q${Number(valor || 0).toFixed(2)}`;

export default function ReciboVenta({
  documento,
  montoRecibido,
  cambio,
}: Props) {
  return (
    <div
      id="recibo-imprimible"
      className="mx-auto w-full max-w-2xl bg-white p-6 text-slate-900 print:max-w-none print:p-0"
    >
      <header className="border-b-2 border-slate-900 pb-4 text-center">
        <h1 className="text-2xl font-bold uppercase">
          Robles Madera
        </h1>

        <p className="font-semibold">
          {documento.sucursal.nombre}
        </p>

        {documento.sucursal.direccion && (
          <p className="text-sm">
            {documento.sucursal.direccion}
          </p>
        )}

        {documento.sucursal.telefono && (
          <p className="text-sm">
            Teléfono:{" "}
            {documento.sucursal.telefono}
          </p>
        )}
      </header>

      <section className="grid grid-cols-2 gap-2 border-b py-4 text-sm">
        <p>
          <strong>Recibo:</strong>{" "}
          {documento.codigo_documento}
        </p>

        <p className="text-right">
          <strong>Fecha:</strong>{" "}
          {new Date(
            documento.fecha,
          ).toLocaleString()}
        </p>

        <p>
          <strong>Venta:</strong>{" "}
          {documento.codigo_venta || "-"}
        </p>

        <p className="text-right">
          <strong>Vendedor:</strong>{" "}
          {documento.vendedor}
        </p>
      </section>

      <section className="border-b py-4 text-sm">
        <p>
          <strong>Cliente:</strong>{" "}
          {documento.cliente.nombre}
        </p>

        <p>
          <strong>NIT:</strong>{" "}
          {documento.cliente.nit || "C/F"}
        </p>

        {documento.cliente.telefono && (
          <p>
            <strong>Teléfono:</strong>{" "}
            {documento.cliente.telefono}
          </p>
        )}
      </section>

      <table className="my-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-900">
            <th className="py-2 text-left">
              Producto
            </th>
            <th className="py-2 text-center">
              Cant.
            </th>
            <th className="py-2 text-right">
              Precio
            </th>
            <th className="py-2 text-right">
              Subtotal
            </th>
          </tr>
        </thead>

        <tbody>
          {documento.detalles.map(
            (detalle) => (
              <tr
                key={
                  detalle.id_documento_detalle
                }
                className="border-b"
              >
                <td className="py-2">
                  <p className="font-semibold">
                    {detalle.descripcion}
                  </p>

                  <p className="text-xs">
                    {detalle.codigo_item}
                  </p>
                </td>

                <td className="py-2 text-center">
                  {detalle.cantidad}
                </td>

                <td className="py-2 text-right">
                  {moneda(
                    detalle.precio_unitario,
                  )}
                </td>

                <td className="py-2 text-right">
                  {moneda(detalle.subtotal)}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>

      <section className="ml-auto w-full max-w-sm space-y-2 border-t pt-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>
            {moneda(documento.subtotal)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Descuento</span>
          <span>
            -{moneda(documento.descuento)}
          </span>
        </div>

        <div className="flex justify-between border-t pt-2 text-xl font-bold">
          <span>Total</span>
          <span>
            {moneda(documento.total)}
          </span>
        </div>

        {documento.pagos.map((pago) => (
          <div
            key={pago.id_documento_pago}
            className="flex justify-between text-sm"
          >
            <span>{pago.metodo_pago}</span>
            <span>{moneda(pago.monto)}</span>
          </div>
        ))}

        {montoRecibido !== undefined && (
          <div className="flex justify-between text-sm">
            <span>Recibido</span>
            <span>
              {moneda(montoRecibido)}
            </span>
          </div>
        )}

        {cambio !== undefined && (
          <div className="flex justify-between font-semibold">
            <span>Cambio</span>
            <span>{moneda(cambio)}</span>
          </div>
        )}
      </section>

      <footer className="mt-8 border-t-2 border-slate-900 pt-4 text-center">
        <p className="font-semibold">
          Gracias por su compra
        </p>

        <p className="mt-1 text-xs">
          Conserve este recibo para cualquier
          consulta relacionada con su compra.
        </p>
      </footer>
    </div>
  );
}