export const CONTACT_NAME_MAX = 80;
export const CONTACT_EMAIL_MAX = 254;
export const CONTACT_MESSAGE_MAX = 4000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactFields = {
  name: string;
  email: string;
  message: string;
  website: string;
};

export type ContactValidationError =
  | "nameRequired"
  | "nameTooLong"
  | "emailRequired"
  | "emailInvalid"
  | "emailTooLong"
  | "messageRequired"
  | "messageTooLong";

export type ContactValidationResult =
  | { ok: true; honeypot: true }
  | {
      ok: true;
      honeypot: false;
      name: string;
      email: string;
      message: string;
    }
  | { ok: false; error: ContactValidationError };

export function parseContactFields(input: {
  name: string;
  email: string;
  message: string;
  website?: string;
}): ContactValidationResult {
  const website = (input.website ?? "").trim();
  if (website) {
    return { ok: true, honeypot: true };
  }

  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name) return { ok: false, error: "nameRequired" };
  if (name.length > CONTACT_NAME_MAX) return { ok: false, error: "nameTooLong" };
  if (!email) return { ok: false, error: "emailRequired" };
  if (email.length > CONTACT_EMAIL_MAX) return { ok: false, error: "emailTooLong" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "emailInvalid" };
  if (!message) return { ok: false, error: "messageRequired" };
  if (message.length > CONTACT_MESSAGE_MAX) return { ok: false, error: "messageTooLong" };

  return { ok: true, honeypot: false, name, email, message };
}

export function clientIpFromHeaders(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function contactTo(value: string | undefined = process.env.CONTACT_TO): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
