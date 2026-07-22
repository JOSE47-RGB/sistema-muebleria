import BotonPrimario from "./BotonPrimario";
import BotonSecundario from "./BotonSecundario";

type Props = {
  abierto: boolean;
  codigoApartado: string;
  cliente: string;
  total: number;
  enganche: number;
  saldo: number;
  onVerDetalle: () => void;
  onNuevoApartado: () => void;
};

const moneda = (valor: number) =>
  `Q${Number(valor || 0).toFixed(2)}`;

export default function ModalApartadoExitoso({
  abierto,
  codigoApartado,
  cliente,
  total,
  enganche,
  saldo,
  onVerDetalle,
  onNuevoApartado,
}: Props) {
  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700">
            ✓
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            Apartado registrado
          </h2>

          <p className="mt-1 text-slate-500">
            Los productos fueron reservados
            correctamente.
          </p>
        </div>

        <div className="my-6 space-y-3 rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">
              Código
            </span>

            <span className="font-bold">
              {codigoApartado}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-500">
              Cliente
            </span>

            <span className="text-right font-semibold">
              {cliente}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">
              Total
            </span>

            <span className="font-bold">
              {moneda(total)}
            </span>
          </div>

          <div className="flex justify-between text-blue-700">
            <span>Enganche</span>

            <span className="font-bold">
              {moneda(enganche)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-3 text-lg">
            <span className="font-bold">
              Saldo pendiente
            </span>

            <span className="font-bold text-red-600">
              {moneda(saldo)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BotonPrimario
            type="button"
            onClick={onVerDetalle}
          >
            Ver apartado
          </BotonPrimario>

          <BotonSecundario
            type="button"
            onClick={onNuevoApartado}
          >
            Nuevo apartado
          </BotonSecundario>
        </div>
      </div>
    </div>
  );
}