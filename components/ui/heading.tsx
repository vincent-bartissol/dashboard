import type { ReactNode } from "react";

const pageSizes = {
  md: "text-2xl",
  lg: "text-3xl",
} as const;

export function PageTitle({
  children,
  size = "md",
  className = "",
}: {
  children: ReactNode;
  size?: keyof typeof pageSizes;
  className?: string;
}) {
  return (
    <h1
      className={`font-display font-semibold tracking-tight text-navy ${pageSizes[size]} ${className}`}
    >
      {children}
    </h1>
  );
}

const sectionSizes = {
  md: "text-lg",
  lg: "text-2xl",
} as const;

export function SectionTitle({
  children,
  as: Tag = "h2",
  size = "md",
  invert = false,
  className = "",
}: {
  children: ReactNode;
  as?: "h2" | "h3";
  size?: keyof typeof sectionSizes;
  invert?: boolean;
  className?: string;
}) {
  return (
    <Tag
      className={`font-display font-semibold ${
        invert ? "text-white" : "text-navy"
      } ${sectionSizes[size]} ${className}`}
    >
      {children}
    </Tag>
  );
}
