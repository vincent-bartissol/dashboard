import type { Transporter } from "nodemailer";
import type { Resend } from "resend";

export type MailerProvider = "mailpit" | "resend";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export function resolveMailerProvider(
  value: string | undefined = process.env.MAILER_PROVIDER,
): MailerProvider {
  return value === "resend" ? "resend" : "mailpit";
}

export function emailFrom(value: string | undefined = process.env.EMAIL_FROM): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Paris Ouverte <noreply@localhost>";
}

export function smtpOptions(
  env: { SMTP_HOST?: string; SMTP_PORT?: string } = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
  },
) {
  return {
    host: env.SMTP_HOST || "localhost",
    port: Number(env.SMTP_PORT || 1025),
    secure: false as const,
  };
}

export function assertMailerConfig(
  env: {
    MAILER_PROVIDER?: string;
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
  } = {
    MAILER_PROVIDER: process.env.MAILER_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  },
) {
  if (resolveMailerProvider(env.MAILER_PROVIDER) !== "resend") return;
  if (!env.RESEND_API_KEY?.trim()) {
    throw new Error("RESEND_API_KEY is required when MAILER_PROVIDER=resend");
  }
  if (!env.EMAIL_FROM?.trim()) {
    throw new Error("EMAIL_FROM is required when MAILER_PROVIDER=resend");
  }
}

let mailpitTransporter: Transporter | null = null;
let resendClient: Resend | null = null;

async function getMailpitTransporter() {
  if (!mailpitTransporter) {
    const nodemailer = await import("nodemailer");
    mailpitTransporter = nodemailer.createTransport(smtpOptions());
  }
  return mailpitTransporter;
}

async function getResendClient() {
  assertMailerConfig();
  if (!resendClient) {
    const { Resend } = await import("resend");
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

async function sendWithMailpit(input: SendEmailInput) {
  const transporter = await getMailpitTransporter();
  await transporter.sendMail({
    from: emailFrom(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

async function sendWithResend(input: SendEmailInput) {
  const resend = await getResendClient();
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const provider = resolveMailerProvider();
  if (provider === "resend") {
    await sendWithResend(input);
    return;
  }
  await sendWithMailpit(input);
}
