type Props = {
  porcentaje: number;
  entregado?: boolean;
};

export default function BarraProgresoApartado({
  porcentaje,
  entregado = false,
}: Props) {
  const porcentajeSeguro = Math.min(
    100,
    Math.max(0, Number(porcentaje || 0)),
  );

  const elegibleEntrega =
    porcentajeSeguro >= 85;

  let textoEstado = "En proceso";

  if (entregado) {
    textoEstado = "Productos entregados";
  } else if (porcentajeSeguro >= 100) {
    textoEstado = "Pagado completamente";
  } else if (elegibleEntrega) {
    textoEstado = "Listo para entrega";
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          Progreso del apartado
        </span>

        <span className="text-sm font-bold text-blue-700">
          {porcentajeSeguro.toFixed(2)}%
        </span>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-slate-200">
        <div
          className={[
            "h-full rounded-full transition-all duration-500",
            entregado
              ? "bg-green-600"
              : porcentajeSeguro >= 85
                ? "bg-green-500"
                : porcentajeSeguro >= 50
                  ? "bg-blue-500"
                  : "bg-amber-500",
          ].join(" ")}
          style={{
            width: `${porcentajeSeguro}%`,
          }}
        />
      </div>

      <div
        className={[
          "mt-3 rounded-lg px-4 py-3 text-sm font-semibold",
          entregado
            ? "bg-green-100 text-green-800"
            : elegibleEntrega
              ? "bg-green-50 text-green-700"
              : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        {textoEstado}

        {!entregado && !elegibleEntrega && (
          <span>
            {" "}
            — Debe alcanzar al menos el 85% para
            autorizar la entrega.
          </span>
        )}
      </div>
    </div>
  );
}