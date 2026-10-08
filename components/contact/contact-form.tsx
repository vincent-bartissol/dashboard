"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { submitContact } from "@/lib/actions/contact";
import { formString } from "@/lib/safe-string";
import { CONTACT_EMAIL_MAX, CONTACT_MESSAGE_MAX, CONTACT_NAME_MAX } from "@/lib/contact";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function ContactForm() {
  const t = useTranslations("Contact");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    setPending(true);
    try {
      const result = await submitContact({
        name: formString(form, "name"),
        email: formString(form, "email"),
        message: formString(form, "message"),
        website: formString(form, "website"),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
    } catch {
      setError(t("genericError"));
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return <p className="text-sm text-muted">{t("success")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          maxLength={CONTACT_NAME_MAX}
          autoComplete="name"
        />
      </div>
      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          maxLength={CONTACT_EMAIL_MAX}
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="message">{t("message")}</Label>
        <Textarea id="message" name="message" required maxLength={CONTACT_MESSAGE_MAX} rows={6} />
      </div>
      <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("pending") : t("submit")}
      </Button>
    </form>
  );
}
