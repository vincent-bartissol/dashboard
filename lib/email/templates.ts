import type { AppLocale } from "@/i18n/routing";
import { interpolate, mailCopy } from "./locale";

const NAVY = "#12263a";
const CREAM = "#f6f1e7";
const PAPER = "#fffdf8";
const ACCENT = "#c8102e";
const MUTED = "#5c6570";
const INK = "#1c1917";

export type MailContent = {
  subject: string;
  text: string;
  html: string;
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function button(href: string, label: string) {
  const safeHref = escapeHtml(href);
  return `<a href="${safeHref}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">${escapeHtml(label)}</a>
<p style="margin:16px 0 0;font-size:13px;color:${MUTED};word-break:break-all;">${safeHref}</p>`;
}

function layout({
  locale,
  subject,
  preview,
  bodyHtml,
  bodyText,
}: {
  locale: AppLocale;
  subject: string;
  preview: string;
  bodyHtml: string;
  bodyText: string;
}): MailContent {
  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${PAPER};border:1px solid #e4dcd0;border-radius:16px;">
        <tr>
          <td style="background:${NAVY};color:#ffffff;padding:20px 28px;border-radius:16px 16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:600;">
            Paris Ouverte
          </td>
        </tr>
        <tr>
          <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:${INK};">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${MUTED};">
            Paris Ouverte
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
  return { subject, text: bodyText, html };
}

export function verificationMail(url: string, locale: AppLocale = "fr"): MailContent {
  const copy = mailCopy(locale);
  return layout({
    locale,
    subject: copy.verificationSubject,
    preview: copy.verificationPreview,
    bodyHtml: `<p style="margin:0 0 16px;">${escapeHtml(copy.verificationBody)}</p>
<p style="margin:0;">${button(url, copy.verificationButton)}</p>`,
    bodyText: interpolate(copy.verificationText, { url }),
  });
}

export function otpMail(otp: string, locale: AppLocale = "fr"): MailContent {
  const copy = mailCopy(locale);
  const safeOtp = escapeHtml(otp);
  return layout({
    locale,
    subject: copy.otpSubject,
    preview: copy.otpPreview,
    bodyHtml: `<p style="margin:0 0 16px;">${escapeHtml(copy.otpBody)}</p>
<p style="margin:0 0 16px;font-size:32px;letter-spacing:0.2em;font-weight:700;color:${NAVY};">${safeOtp}</p>
<p style="margin:0;color:${MUTED};font-size:14px;">${escapeHtml(copy.otpExpiry)}</p>`,
    bodyText: interpolate(copy.otpText, { otp }),
  });
}

export function changeEmailMail(
  url: string,
  newEmail: string,
  locale: AppLocale = "fr",
): MailContent {
  const copy = mailCopy(locale);
  return layout({
    locale,
    subject: copy.changeSubject,
    preview: interpolate(copy.changePreview, { email: newEmail }),
    bodyHtml: `<p style="margin:0 0 16px;">${escapeHtml(interpolate(copy.changeBody, { email: newEmail }))}</p>
<p style="margin:0;">${button(url, copy.changeButton)}</p>`,
    bodyText: interpolate(copy.changeText, { email: newEmail, url }),
  });
}

export function resetPasswordMail(url: string, locale: AppLocale = "fr"): MailContent {
  const copy = mailCopy(locale);
  return layout({
    locale,
    subject: copy.resetSubject,
    preview: copy.resetPreview,
    bodyHtml: `<p style="margin:0 0 16px;">${escapeHtml(copy.resetBody)}</p>
<p style="margin:0;">${button(url, copy.resetButton)}</p>`,
    bodyText: interpolate(copy.resetText, { url }),
  });
}

export function alertMail(
  values: { station: string; bikes: string; threshold: string; url: string },
  locale: AppLocale = "fr",
): MailContent {
  const copy = mailCopy(locale);
  return layout({
    locale,
    subject: interpolate(copy.alertSubject, { station: values.station }),
    preview: interpolate(copy.alertPreview, {
      bikes: values.bikes,
      threshold: values.threshold,
    }),
    bodyHtml: `<p style="margin:0 0 16px;">${escapeHtml(
      interpolate(copy.alertBody, {
        station: values.station,
        bikes: values.bikes,
        threshold: values.threshold,
      }),
    )}</p>
<p style="margin:0;">${button(values.url, copy.alertButton)}</p>`,
    bodyText: interpolate(copy.alertText, values),
  });
}
