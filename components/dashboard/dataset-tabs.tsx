import Link from "next/link";

export function DatasetTabs({
  tabs,
  active,
}: {
  tabs: { href: string; label: string }[];
  active: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const current = tab.href === active;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm ${
              current ? "bg-navy text-white" : "border border-line bg-paper text-navy"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
