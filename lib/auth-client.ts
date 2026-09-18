"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

// Admin APIs stay server-only via lib/actions/admin.ts (not adminClient).
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
});
