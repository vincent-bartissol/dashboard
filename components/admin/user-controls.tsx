"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useNotify } from "@/components/dashboard/notifications";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import {
  banDemoUser,
  revokeDemoSession,
  setDemoUserRole,
  unbanDemoUser,
} from "@/lib/demo/store";

type ErrorKey =
  | "errors.selfBan"
  | "errors.peerAdmin"
  | "errors.selfDemote"
  | "errors.lastAdmin"
  | "errors.notFound"
  | "errors.ban"
  | "errors.unban"
  | "errors.role"
  | "errors.session"
  | "errors.generic";

const ERROR_KEYS = new Set<string>([
  "selfBan",
  "peerAdmin",
  "selfDemote",
  "lastAdmin",
  "notFound",
  "ban",
  "unban",
  "role",
  "session",
  "generic",
]);

export function AdminUserControls({
  userId,
  role,
  banned,
  isSelf,
  targetIsAdmin,
  sessions,
}: Readonly<{
  userId: string;
  role: string;
  banned: boolean;
  isSelf: boolean;
  targetIsAdmin: boolean;
  sessions: {
    id: string;
    live: boolean;
    createdLabel: string;
    ipAddress: string | null;
    userAgent: string | null;
  }[];
}>) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const notify = useNotify();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");

  function run(
    action: () => { ok: boolean; error?: string },
    successMessage: string,
  ) {
    setError(null);
    startTransition(() => {
      const result = action();
      if (!result.ok) {
        const code = result.error && ERROR_KEYS.has(result.error) ? result.error : "generic";
        setError(t(`errors.${code}` as ErrorKey));
        return;
      }
      notify({ tone: "status", message: successMessage });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <SectionTitle>{t("moderation.title")}</SectionTitle>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        {banned ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() => run(() => unbanDemoUser(userId), t("moderation.unbannedToast"))}
          >
            {t("moderation.unban")}
          </Button>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="banReason">{t("moderation.banReason")}</Label>
            <Input
              id="banReason"
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={pending || isSelf || targetIsAdmin}
              onClick={() =>
                run(() => banDemoUser(userId, banReason), t("moderation.bannedToast"))
              }
            >
              {t("moderation.ban")}
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={pending || role === "admin"}
            onClick={() =>
              run(() => setDemoUserRole(userId, "admin"), t("moderation.promotedToast"))
            }
          >
            {t("moderation.makeAdmin")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending || role === "user" || isSelf}
            onClick={() =>
              run(() => setDemoUserRole(userId, "user"), t("moderation.demotedToast"))
            }
          >
            {t("moderation.makeUser")}
          </Button>
        </div>
      </Card>
      <Card className="space-y-3 p-4">
        <SectionTitle>{t("moderation.sessionsTitle")}</SectionTitle>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted">{t("sessions.empty")}</p>
        ) : null}
        <ul className="space-y-2 text-sm">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 py-2 last:border-0"
            >
              <span>
                {session.createdLabel}
                {session.live ? ` · ${t("sessions.liveYes")}` : ""}
                {session.ipAddress ? ` · ${session.ipAddress}` : ""}
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => run(() => revokeDemoSession(), t("moderation.revokedToast"))}
              >
                {t("moderation.revoke")}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
