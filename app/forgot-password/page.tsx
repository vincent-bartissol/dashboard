import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Card } from "@/components/ui/card";
import { requireGuest } from "@/lib/session";

export default async function ForgotPasswordPage({
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
          <h1 className="text-2xl font-semibold text-navy">Mot de passe oublié</h1>
          <p className="mt-1 mb-6 text-sm text-muted">
            Indiquez votre e-mail. Si un compte existe, vous recevrez un lien pour choisir un
            nouveau mot de passe.
          </p>
          <ForgotPasswordForm />
          <p className="mt-4 text-sm text-muted">
            <Link href="/login" className="font-medium text-navy hover:underline">
              Retour à la connexion
            </Link>
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
