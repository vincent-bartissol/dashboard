import { Link } from "@/i18n/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-accent text-white hover:bg-[#a50e26] disabled:bg-[#d9a3ad]",
  secondary:
    "bg-navy text-white hover:bg-navy-2 disabled:bg-[#7a8794]",
  ghost:
    "border border-line bg-paper text-ink hover:border-navy/40 disabled:opacity-50",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  href?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  ...props
}: Props) {
  const classes = `inline-flex h-11 items-center justify-center rounded-none px-5 text-sm font-medium transition ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
