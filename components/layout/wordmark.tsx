import { Link } from "@/i18n/navigation";

export function Wordmark({
  href = "/",
  invert = false,
  size = "md",
}: {
  href?: string;
  invert?: boolean;
  size?: "md" | "lg";
}) {
  const titleSize = size === "lg" ? "text-4xl sm:text-5xl" : "text-xl";
  const subSize = size === "lg" ? "text-lg sm:text-xl" : "text-sm";

  return (
    <Link
      href={href}
      className={`group inline-flex flex-col ${invert ? "text-white" : "text-heading"}`}
    >
      <span className={`font-display font-semibold leading-none tracking-tight ${titleSize}`}>
        Paris
      </span>
      <span
        className={`mt-0.5 font-display font-medium leading-none ${subSize} ${
          invert ? "text-white/80" : "text-heading/70"
        }`}
      >
        Ouverte
      </span>
      <span
        className={`mt-1.5 block bg-accent transition-all ${
          size === "lg"
            ? "h-1.5 w-14 group-hover:w-20"
            : "h-1 w-10 group-hover:w-14"
        }`}
        aria-hidden
      />
    </Link>
  );
}
