import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { withLocaleInAbsoluteUrl } from "@/i18n/path";
import { mailLocale } from "@/lib/email/locale";
import { changeEmailMail, otpMail, resetPasswordMail, verificationMail } from "@/lib/email/templates";
import { ADMIN_ROLES, parseAdminUserIds, USER_ROLE } from "@/lib/admin";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  appName: "Paris Ouverte",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: USER_ROLE,
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
    sendResetPassword: async ({ user, url }) => {
      const locale = await mailLocale();
      const mail = resetPasswordMail(withLocaleInAbsoluteUrl(url, locale), locale);
      await sendEmail({
        to: user.email,
        ...mail,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url }) => {
      const locale = await mailLocale();
      const mail = verificationMail(withLocaleInAbsoluteUrl(url, locale), locale);
      await sendEmail({ to: user.email, ...mail });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        const locale = await mailLocale();
        const mail = changeEmailMail(withLocaleInAbsoluteUrl(url, locale), newEmail, locale);
        await sendEmail({ to: user.email, ...mail });
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (created) => {
          await db
            .update(schema.user)
            .set({ twoFactorEnabled: true })
            .where(eq(schema.user.id, created.id));
          await db.insert(schema.twoFactor).values({
            id: crypto.randomUUID(),
            userId: created.id,
            secret: "",
            backupCodes: "[]",
            verified: false,
            failedVerificationCount: 0,
          });
        },
      },
    },
  },
  plugins: [
    twoFactor({
      issuer: "Paris Ouverte",
      otpOptions: {
        storeOTP: "hashed",
        sendOTP: async ({ user, otp }) => {
          const mail = otpMail(otp, await mailLocale());
          await sendEmail({ to: user.email, ...mail });
        },
      },
    }),
    admin({
      defaultRole: USER_ROLE,
      adminRoles: [...ADMIN_ROLES],
      adminUserIds: parseAdminUserIds(),
      defaultBanReason: "Banned by admin",
    }),
    nextCookies(),
  ],
});

export type SessionUser = {
  id: string;
  role?: string | null;
  banned?: boolean | null;
  banExpires?: Date | string | number | null;
};
