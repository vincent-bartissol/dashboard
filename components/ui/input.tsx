import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

const fieldClass =
  "h-11 w-full rounded-xl border border-line bg-paper px-3 text-sm text-ink outline-none transition focus:border-navy";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClass} ${props.className ?? ""}`} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldClass} ${props.className ?? ""}`} {...props} />;
}

export function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-navy">
      {children}
    </label>
  );
}
