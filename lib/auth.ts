import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
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
      void sendEmail({
        to: user.email,
        subject: "Confirmez votre adresse e-mail",
        text: `Cliquez pour confirmer votre adresse : ${url}`,
      }).catch((error) => {
        console.error("sendVerificationEmail failed", error);
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        void sendEmail({
          to: user.email,
          subject: "Confirmez le changement d’e-mail",
          text: `Cliquez pour autoriser le changement vers ${newEmail} : ${url}`,
        }).catch((error) => {
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
          void sendEmail({
            to: user.email,
            subject: "Votre code de connexion",
            text: `Votre code : ${otp}. Il expire dans 3 minutes.`,
          }).catch((error) => {
            console.error("sendOTP failed", error);
          });
        },
      },
    }),
    nextCookies(),
  ],
});
