import Link from "next/link";

export function DatasetTabs({
  tabs,
  active,
}: {
  tabs: { href: string; label: string }[];
  active: string;
}) {
  return (
    <div className="flex flex-wrap gap-0 border-b border-line">
      {tabs.map((tab) => {
        const current = tab.href === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-none border-b-2 px-4 py-2 text-sm transition ${
              current
                ? "border-accent font-medium text-navy"
                : "border-transparent text-muted hover:text-navy"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
