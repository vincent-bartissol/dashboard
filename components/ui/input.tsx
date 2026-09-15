import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

const fieldClass =
  "h-11 w-full surface-panel focus-field px-3 text-sm text-ink outline-none transition";

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
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-heading">
      {children}
    </label>
  );
}
