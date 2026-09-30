import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact/contact-form";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/heading";

export default async function ContactPage() {
  const t = await getTranslations("Contact");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main id="main" className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="relative w-full max-w-md">
          <PageTitle>{t("title")}</PageTitle>
          <p className="mt-1 mb-6 text-sm text-muted">{t("body")}</p>
          <ContactForm />
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
