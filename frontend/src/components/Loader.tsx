interface Props {
  texto?: string;
}

export default function Loader({ texto = "Cargando..." }: Props) {
  return (
    <div className="flex items-center gap-3 text-slate-500">
      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span>{texto}</span>
    </div>
  );
}