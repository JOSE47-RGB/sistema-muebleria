interface Props {
  titulo: string;
  descripcion?: string;
}

export default function TituloPagina({ titulo, descripcion }: Props) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-slate-900">{titulo}</h1>
      {descripcion && (
        <p className="text-slate-500 mt-1">{descripcion}</p>
      )}
    </div>
  );
}