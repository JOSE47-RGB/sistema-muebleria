import BotonSecundario from "./BotonSecundario";

interface Props {
  pagina: number;
  totalPaginas: number;
  onAnterior: () => void;
  onSiguiente: () => void;
}

export default function Paginacion({
  pagina,
  totalPaginas,
  onAnterior,
  onSiguiente,
}: Props) {
  return (
    <div className="flex items-center justify-between mt-5">
      <BotonSecundario
        type="button"
        onClick={onAnterior}
        disabled={pagina <= 1}
      >
        Anterior
      </BotonSecundario>

      <p className="text-slate-600">
        Página {pagina} de {totalPaginas}
      </p>

      <BotonSecundario
        type="button"
        onClick={onSiguiente}
        disabled={pagina >= totalPaginas}
      >
        Siguiente
      </BotonSecundario>
    </div>
  );
}