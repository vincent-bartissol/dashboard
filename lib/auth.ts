import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { changeEmailMail, otpMail, verificationMail } from "@/lib/email/templates";
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
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Réinitialisez votre mot de passe",
        text: `Cliquez pour choisir un nouveau mot de passe : ${url}`,
      }).catch((error) => {
        console.error("sendResetPassword failed", error);
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url }) => {
      const mail = verificationMail(url);
      void sendEmail({ to: user.email, ...mail }).catch((error) => {
        console.error("sendVerificationEmail failed", error);
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        const mail = changeEmailMail(url, newEmail);
        void sendEmail({ to: user.email, ...mail }).catch((error) => {
          console.error("sendChangeEmailConfirmation failed", error);
        });
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
        sendOTP: async ({ user, otp }) => {
          const mail = otpMail(otp);
          await sendEmail({ to: user.email, ...mail });
        },
      },
    }),
    nextCookies(),
  ],
});
