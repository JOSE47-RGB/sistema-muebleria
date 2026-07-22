import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function BotonSecundario({
  children,
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`
        bg-slate-600 hover:bg-slate-700
        text-white font-semibold
        rounded-xl px-5 py-3
        shadow-md transition
        disabled:opacity-60 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  );
}