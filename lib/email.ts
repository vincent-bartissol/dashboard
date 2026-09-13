export type MailerProvider = "mailpit" | "resend";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
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

async function sendWithMailpit(input: SendEmailInput) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport(smtpOptions());
  await transporter.sendMail({
    from: emailFrom(),
    to: input.to,
    subject: input.subject,
    text: input.text,
  });
}

async function sendWithResend(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required when MAILER_PROVIDER=resend");
  }
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: emailFrom(),
    to: input.to,
    subject: input.subject,
    text: input.text,
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
