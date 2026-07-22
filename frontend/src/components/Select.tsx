import type { SelectHTMLAttributes, ReactNode } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export default function Select({
  label,
  children,
  className = "",
  ...props
}: Props) {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}

      <select
        {...props}
        className={`
          w-full border border-slate-300
          rounded-xl px-4 py-3
          outline-none bg-white
          focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          ${className}
        `}
      >
        {children}
      </select>
    </div>
  );
}