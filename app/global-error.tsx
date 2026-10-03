"use client";

import { useEffect, useMemo, useState } from "react";
import * as Sentry from "@sentry/nextjs";

const COPY = {
  fr: {
    title: "Une erreur est survenue",
    body: "Paris Ouverte a rencontré un problème inattendu. Vous pouvez recharger la page.",
    reload: "Recharger",
  },
  en: {
    title: "Something went wrong",
    body: "Paris Ouverte hit an unexpected error. You can reload the page.",
    reload: "Reload",
  },
  es: {
    title: "Se produjo un error",
    body: "Paris Ouverte encontró un problema inesperado. Puede recargar la página.",
    reload: "Recargar",
  },
} as const;

type Locale = keyof typeof COPY;

function localeFromPathname(pathname: string): Locale {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (seg === "en" || seg === "es") return seg;
  return "fr";
}

export default function GlobalError({
  error,
}: Readonly<{
  error: Error & { digest?: string };
}>) {
  const [locale] = useState<Locale>(() =>
    typeof window === "undefined" ? "fr" : localeFromPathname(window.location.pathname),
  );

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const copy = useMemo(() => COPY[locale], [locale]);

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f1e7",
          color: "#1c1917",
          fontFamily:
            '"IBM Plex Sans", system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <main
          style={{
            maxWidth: 420,
            width: "100%",
            margin: 24,
            padding: 28,
            background: "#fffdf8",
            border: "1px solid #e4dcd0",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#12263a",
            }}
          >
            Paris Ouverte
          </p>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: 24,
              fontFamily: "Newsreader, Georgia, serif",
              color: "#12263a",
            }}
          >
            {copy.title}
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.5 }}>{copy.body}</p>
          {error.digest ? (
            <p style={{ margin: "0 0 20px", fontSize: 12, color: "#5c6570" }}>
              {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              appearance: "none",
              border: 0,
              background: "#c8102e",
              color: "#fff",
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {copy.reload}
          </button>
        </main>
      </body>
    </html>
  );
}
