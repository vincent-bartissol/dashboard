"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";

export default function GlobalError({
  error,
}: Readonly<{
  error: Error & { digest?: string };
}>) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
