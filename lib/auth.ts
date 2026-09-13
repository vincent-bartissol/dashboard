import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import * as schema from "@/lib/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
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
  plugins: [nextCookies()],
});
