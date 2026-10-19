import { BUILD_DEMO_USER } from "@/lib/demo/seed";
import type { DemoSession } from "@/lib/demo/types";

/** Static-render session: always a visitor so pages can export without cookies. */
export function getBuildSession(): {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: string;
    banned: boolean | null;
    banExpires: null;
  };
  session: { id: string; userId: string };
} {
  return {
    user: {
      id: BUILD_DEMO_USER.id,
      name: BUILD_DEMO_USER.name,
      email: BUILD_DEMO_USER.email,
      emailVerified: BUILD_DEMO_USER.emailVerified,
      role: BUILD_DEMO_USER.role,
      banned: false,
      banExpires: null,
    },
    session: { id: "demo-build-session", userId: BUILD_DEMO_USER.id },
  };
}

export function toClientSession(session: DemoSession | null) {
  if (!session) return null;
  return {
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      emailVerified: session.emailVerified,
      role: session.role,
      banned: false,
      banExpires: null,
    },
  };
}
