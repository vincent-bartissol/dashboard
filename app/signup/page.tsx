import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Card } from "@/components/ui/card";
import { requireGuest } from "@/lib/session";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  await requireGuest(next);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader variant="auth" />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-navy">Créer un compte</h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            E-mail et mot de passe (8 caractères minimum). Un e-mail de confirmation
            vous sera envoyé.
          </p>
          <Suspense>
            <AuthForm mode="signup" />
          </Suspense>
          <p className="mt-4 text-sm text-muted">
            Déjà inscrit ?{" "}
            <Link href="/login" className="font-medium text-navy hover:underline">
              Se connecter
            </Link>
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
