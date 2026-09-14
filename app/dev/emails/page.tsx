import { notFound } from "next/navigation";
import { DatasetTabs } from "@/components/dashboard/dataset-tabs";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Card } from "@/components/ui/card";
import {
  changeEmailMail,
  otpMail,
  resetPasswordMail,
  verificationMail,
  type MailContent,
} from "@/lib/email/templates";
import { firstSearchParam } from "@/lib/safe-next";

const SAMPLE_URL = "http://localhost:3000/api/auth/verify-email?token=apercu";
const SAMPLE_RESET_URL = "http://localhost:3000/reset-password?token=apercu";
const SAMPLE_OTP = "123456";
const SAMPLE_EMAIL = "nouvelle@example.com";

const KINDS = [
  { id: "verification", label: "Confirmation" },
  { id: "otp", label: "Code de connexion" },
  { id: "change-email", label: "Changement d’e-mail" },
  { id: "reset", label: "Mot de passe oublié" },
] as const;

type Kind = (typeof KINDS)[number]["id"];

function isKind(value: string | undefined): value is Kind {
  return KINDS.some((item) => item.id === value);
}

function previewMail(kind: Kind): MailContent {
  switch (kind) {
    case "otp":
      return otpMail(SAMPLE_OTP);
    case "change-email":
      return changeEmailMail(SAMPLE_URL, SAMPLE_EMAIL);
    case "reset":
      return resetPasswordMail(SAMPLE_RESET_URL);
    default:
      return verificationMail(SAMPLE_URL);
  }
}

export default async function EmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const requested = firstSearchParam((await searchParams).kind);
  const kind: Kind = isKind(requested) ? requested : "verification";
  const mail = previewMail(kind);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-navy">Aperçu des e-mails</h1>
        <p className="mt-1 mb-6 text-muted">
          Rendu local des gabarits, sans envoi. Invisible en production.
        </p>
        <DatasetTabs
          tabs={KINDS.map((item) => ({
            href: `/dev/emails?kind=${item.id}`,
            label: item.label,
          }))}
          active={`/dev/emails?kind=${kind}`}
        />
        <Card className="mt-6 overflow-hidden p-0">
          <div className="border-b border-line px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Objet</p>
            <p className="mt-1 font-medium text-navy">{mail.subject}</p>
          </div>
          <iframe
            title={mail.subject}
            srcDoc={mail.html}
            sandbox=""
            className="h-160 w-full bg-cream"
          />
        </Card>
        <Card className="mt-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Texte brut</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-ink">{mail.text}</pre>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
