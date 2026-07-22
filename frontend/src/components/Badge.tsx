interface Props {
  texto: string;
  tipo?: "verde" | "rojo" | "azul" | "gris" | "amarillo";
}

export default function Badge({ texto, tipo = "gris" }: Props) {
  const estilos = {
    verde: "bg-green-100 text-green-700",
    rojo: "bg-red-100 text-red-700",
    azul: "bg-blue-100 text-blue-700",
    gris: "bg-slate-100 text-slate-700",
    amarillo: "bg-yellow-100 text-yellow-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estilos[tipo]}`}>
      {texto}
    </span>
  );
}