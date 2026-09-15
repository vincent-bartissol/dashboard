import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";

export async function SiteHeader({ variant = "public" }: { variant?: "public" | "auth" }) {
  const session = await getSession();

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Wordmark />
        {variant === "auth" ? null : session ? (
          <Button href="/dashboard" variant="secondary">
            Espace privé
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button href="/login" variant="ghost">
              Connexion
            </Button>
            <Button href="/signup">Créer un compte</Button>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8 text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>Données publiques de la Ville de Paris, licence ODbL.</p>
        <a
          className="font-medium text-navy hover:underline"
          href="https://opendata.paris.fr"
          target="_blank"
          rel="noreferrer"
        >
          opendata.paris.fr
        </a>
      </div>
    </footer>
  );
}
