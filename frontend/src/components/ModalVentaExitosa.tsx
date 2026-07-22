import BotonPrimario from "./BotonPrimario";
import BotonSecundario from "./BotonSecundario";

type Props = {
  abierto: boolean;
  codigoVenta: string;
  codigoRecibo: string;
  total: number;
  cambio: number;
  onVerRecibo: () => void;
  onImprimir: () => void;
  onNuevaVenta: () => void;
};

export default function ModalVentaExitosa({
  abierto,
  codigoVenta,
  codigoRecibo,
  total,
  cambio,
  onVerRecibo,
  onImprimir,
  onNuevaVenta,
}: Props) {
  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700">
            ✓
          </div>

          <h2 className="text-2xl font-bold">
            Venta registrada
          </h2>

          <p className="mt-1 text-slate-500">
            La venta y el recibo se generaron
            correctamente.
          </p>
        </div>

        <div className="my-6 space-y-3 rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">
              Venta
            </span>

            <span className="break-all text-right font-semibold">
              {codigoVenta}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-500">
              Recibo
            </span>

            <span className="font-semibold">
              {codigoRecibo}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">
              Total
            </span>

            <span className="font-bold">
              Q{total.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between text-green-700">
            <span>Cambio</span>

            <span className="font-bold">
              Q{cambio.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <BotonSecundario
            type="button"
            onClick={onVerRecibo}
          >
            Ver recibo
          </BotonSecundario>

          <BotonPrimario
            type="button"
            onClick={onImprimir}
          >
            Imprimir
          </BotonPrimario>

          <BotonSecundario
            type="button"
            onClick={onNuevaVenta}
          >
            Nueva venta
          </BotonSecundario>
        </div>
      </div>
    </div>
  );
}