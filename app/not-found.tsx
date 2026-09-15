import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/heading";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <PageTitle>Page introuvable</PageTitle>
        <p className="mt-2 text-sm text-muted">
          Cette adresse n’existe pas sur Paris Ouverte.
        </p>
        <div className="mt-6">
          <Button href="/">Retour à l’accueil</Button>
        </div>
        <p className="mt-4 text-sm text-muted">
          Ou{" "}
          <Link href="/dashboard" className="font-medium text-navy hover:underline">
            ouvrir le tableau de bord
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
