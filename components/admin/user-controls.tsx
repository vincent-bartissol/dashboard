"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import {
  banUserAction,
  revokeSessionAction,
  setUserRoleAction,
  unbanUserAction,
} from "@/lib/actions/admin";

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
}: {
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
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        const code = result.error && ERROR_KEYS.has(result.error) ? result.error : "generic";
        setError(t(`errors.${code}` as ErrorKey));
        return;
      }
      router.refresh();
    });
  }

  const canBan = !isSelf && !targetIsAdmin && !banned;
  const canDemote = targetIsAdmin && role === "admin" && !isSelf;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle>{t("moderation.title")}</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {banned ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => unbanUserAction({ userId }))}
            >
              {t("moderation.unban")}
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2 sm:max-w-md">
              <Label htmlFor="ban-reason">{t("moderation.banReason")}</Label>
              <Input
                id="ban-reason"
                value={banReason}
                maxLength={200}
                onChange={(event) => setBanReason(event.target.value)}
                disabled={pending || !canBan}
              />
              <Button
                type="button"
                variant="primary"
                disabled={pending || !canBan}
                onClick={() => {
                  if (!window.confirm(t("moderation.confirmBan"))) return;
                  run(() => banUserAction({ userId, banReason }));
                }}
              >
                {t("moderation.ban")}
              </Button>
              {isSelf ? <p className="text-sm text-muted">{t("moderation.cannotSelfBan")}</p> : null}
              {!isSelf && targetIsAdmin ? (
                <p className="text-sm text-muted">{t("moderation.cannotBanAdmin")}</p>
              ) : null}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle>{t("moderation.roleTitle")}</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={role === "admin" ? "secondary" : "ghost"}
            disabled={pending || role === "admin"}
            onClick={() => {
              if (!window.confirm(t("moderation.confirmPromote"))) return;
              run(() => setUserRoleAction({ userId, role: "admin" }));
            }}
          >
            {t("moderation.makeAdmin")}
          </Button>
          <Button
            type="button"
            variant={role === "user" ? "secondary" : "ghost"}
            disabled={pending || !canDemote}
            onClick={() => {
              if (!window.confirm(t("moderation.confirmDemote"))) return;
              run(() => setUserRoleAction({ userId, role: "user" }));
            }}
          >
            {t("moderation.makeUser")}
          </Button>
        </div>
        {isSelf && role === "admin" ? (
          <p className="mt-2 text-sm text-muted">{t("moderation.cannotSelfDemote")}</p>
        ) : null}
      </Card>

      <Card>
        <SectionTitle>{t("moderation.sessionsTitle")}</SectionTitle>
        <ul className="mt-3 space-y-2">
          {sessions.length === 0 ? (
            <li className="text-sm text-muted">{t("sessions.empty")}</li>
          ) : null}
          {sessions.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-line px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="tabular-nums text-heading">{row.createdLabel}</p>
                <p className="truncate text-muted">
                  {row.ipAddress || "—"}
                  {row.userAgent ? ` · ${row.userAgent}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {row.live ? t("sessions.liveYes") : t("sessions.liveNo")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                disabled={pending || !row.live}
                onClick={() => {
                  if (!window.confirm(t("moderation.confirmRevoke"))) return;
                  run(() => revokeSessionAction({ userId, sessionId: row.id }));
                }}
              >
                {t("moderation.revoke")}
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
