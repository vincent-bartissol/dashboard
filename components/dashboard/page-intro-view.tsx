import type { ReactNode } from "react";
import { PageTitle } from "@/components/ui/heading";

export type PageIntroSource = {
  id: string;
  sourceUrl: string;
  title: string;
};

export function PageIntroView({
  title,
  children,
  sources = [],
  sourceLabel,
  opensInNewTab,
}: Readonly<{
  title: string;
  children: ReactNode;
  sources?: PageIntroSource[];
  sourceLabel?: (title: string) => string;
  opensInNewTab?: string;
}>) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="mb-3 block h-1 w-10 bg-accent" aria-hidden />
        <PageTitle size="lg">{title}</PageTitle>
        <p className="mt-2 max-w-2xl text-muted">{children}</p>
      </div>
      {sources.length && sourceLabel ? (
        <div className="flex flex-wrap gap-2 text-sm text-muted">
          {sources.map((item) => (
            <a
              key={item.id}
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-line underline-offset-2 hover:text-heading"
            >
              {sourceLabel(item.title)}
              {opensInNewTab ? <span className="sr-only">{opensInNewTab}</span> : null}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
