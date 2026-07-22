import type { ReactNode } from "react";
import BotonSecundario from "./BotonSecundario";

interface Props {
  abierto: boolean;
  titulo: string;
  children: ReactNode;
  onCerrar: () => void;
}

export default function Modal({
  abierto,
  titulo,
  children,
  onCerrar,
}: Props) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="text-slate-500 hover:text-slate-800 text-2xl"
          >
            ×
          </button>
        </div>

        <div>{children}</div>

        <div className="mt-6 flex justify-end">
          <BotonSecundario type="button" onClick={onCerrar}>
            Cerrar
          </BotonSecundario>
        </div>
      </div>
    </div>
  );
}