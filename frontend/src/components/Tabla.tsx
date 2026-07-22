import type { ReactNode } from "react";

interface Columna<T> {
  titulo: string;
  render: (fila: T) => ReactNode;
}

interface Props<T> {
  columnas: Columna<T>[];
  datos: T[];
  mensajeVacio?: string;
}

export default function Tabla<T>({
  columnas,
  datos,
  mensajeVacio = "No hay datos para mostrar",
}: Props<T>) {
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-100 text-slate-600 text-sm">
          <tr>
            {columnas.map((columna, index) => (
              <th key={index} className="px-5 py-4 font-semibold">
                {columna.titulo}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {datos.length === 0 ? (
            <tr>
              <td
                colSpan={columnas.length}
                className="px-5 py-8 text-center text-slate-500"
              >
                {mensajeVacio}
              </td>
            </tr>
          ) : (
            datos.map((fila, index) => (
              <tr key={index} className="border-t hover:bg-slate-50">
                {columnas.map((columna, i) => (
                  <td key={i} className="px-5 py-4">
                    {columna.render(fila)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}