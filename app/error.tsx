"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-start justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold text-navy">Une erreur est survenue</h1>
      <p className="text-sm text-muted">
        La page n’a pas pu s’afficher. Réessayez dans un instant.
      </p>
      <Button type="button" onClick={() => retry()}>
        Réessayer
      </Button>
    </div>
  );
}
