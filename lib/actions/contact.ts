"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { clientIpFromHeaders, contactTo, parseContactFields } from "@/lib/contact";
import { db } from "@/lib/db";
import { contactMessage } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { contactMail } from "@/lib/email/templates";
import { isAppLocale, routing } from "@/i18n/routing";
import { contactFormLimit, contactGlobalLimit } from "@/lib/rate-limit";

export type ContactSubmitResult = { ok: true } | { ok: false; error: string };

export async function submitContact(input: {
  name: string;
  email: string;
  message: string;
  website?: string;
}): Promise<ContactSubmitResult> {
  const t = await getTranslations("Contact");
  const headerStore = await headers();
  const ip = clientIpFromHeaders(headerStore);
  const globalLimited = contactGlobalLimit.check("contact");
  if (!globalLimited.ok) {
    return { ok: false, error: t("rateLimited") };
  }
  const limited = contactFormLimit.check(ip);
  if (!limited.ok) {
    return { ok: false, error: t("rateLimited") };
  }

  const parsed = parseContactFields(input);
  if (!parsed.ok) {
    return { ok: false, error: t(parsed.error) };
  }
  if (parsed.honeypot) {
    return { ok: true };
  }

  const localeRaw = await getLocale();
  const locale = isAppLocale(localeRaw) ? localeRaw : routing.defaultLocale;
  const id = crypto.randomUUID();
  const createdAt = new Date();

  await db.insert(contactMessage).values({
    id,
    name: parsed.name,
    email: parsed.email,
    message: parsed.message,
    locale,
    emailSent: false,
    createdAt,
  });

  const to = contactTo();
  if (!to) {
    return { ok: false, error: t("sendFailed") };
  }

  try {
    const mail = contactMail(
      {
        name: parsed.name,
        email: parsed.email,
        message: parsed.message,
        locale,
      },
      locale,
    );
    await sendEmail({
      to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: parsed.email,
    });
    await db
      .update(contactMessage)
      .set({ emailSent: true })
      .where(eq(contactMessage.id, id));
  } catch {
    // Keep the row; surface the delivery failure to the visitor.
    return { ok: false, error: t("sendFailed") };
  }

  return { ok: true };
}
