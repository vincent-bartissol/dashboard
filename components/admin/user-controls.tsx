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

export function AdminUserControls({
  userId,
  role,
  banned,
  isSelf,
  sessions,
}: {
  userId: string;
  role: string;
  banned: boolean;
  isSelf: boolean;
  sessions: { id: string; token: string; live: boolean }[];
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
        const key = `errors.${result.error ?? "generic"}` as
          | "errors.selfBan"
          | "errors.lastAdmin"
          | "errors.notFound"
          | "errors.ban"
          | "errors.unban"
          | "errors.role"
          | "errors.session"
          | "errors.generic";
        setError(t(key));
        return;
      }
      router.refresh();
    });
  }

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
                onChange={(event) => setBanReason(event.target.value)}
                disabled={pending || isSelf}
              />
              <Button
                type="button"
                variant="primary"
                disabled={pending || isSelf}
                onClick={() => {
                  if (!window.confirm(t("moderation.confirmBan"))) return;
                  run(() => banUserAction({ userId, banReason }));
                }}
              >
                {t("moderation.ban")}
              </Button>
              {isSelf ? <p className="text-sm text-muted">{t("moderation.cannotSelfBan")}</p> : null}
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
            disabled={pending || role === "user"}
            onClick={() => {
              if (!window.confirm(t("moderation.confirmDemote"))) return;
              run(() => setUserRoleAction({ userId, role: "user" }));
            }}
          >
            {t("moderation.makeUser")}
          </Button>
        </div>
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
              className="flex flex-wrap items-center justify-between gap-2 border border-line px-3 py-2 text-sm"
            >
              <span>{row.live ? t("sessions.yes") : t("sessions.no")}</span>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!window.confirm(t("moderation.confirmRevoke"))) return;
                  run(() =>
                    revokeSessionAction({ userId, sessionToken: row.token }),
                  );
                }}
              >
                <input type="hidden" name="sessionToken" value={row.token} />
                <Button type="submit" variant="ghost" disabled={pending || !row.live}>
                  {t("moderation.revoke")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>

      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
