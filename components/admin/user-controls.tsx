"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type ConfirmKind = "ban" | "promote" | "demote" | "revoke";

type PendingConfirm = {
  kind: ConfirmKind;
  message: string;
  action: () => Promise<{ ok: boolean; error?: string }>;
};

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
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

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

  function askConfirm(next: PendingConfirm) {
    setConfirm(next);
  }

  function onConfirm() {
    if (!confirm) return;
    const action = confirm.action;
    setConfirm(null);
    run(action);
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
                onClick={() =>
                  askConfirm({
                    kind: "ban",
                    message: t("moderation.confirmBan"),
                    action: () => banUserAction({ userId, banReason }),
                  })
                }
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
            onClick={() =>
              askConfirm({
                kind: "promote",
                message: t("moderation.confirmPromote"),
                action: () => setUserRoleAction({ userId, role: "admin" }),
              })
            }
          >
            {t("moderation.makeAdmin")}
          </Button>
          <Button
            type="button"
            variant={role === "user" ? "secondary" : "ghost"}
            disabled={pending || !canDemote}
            onClick={() =>
              askConfirm({
                kind: "demote",
                message: t("moderation.confirmDemote"),
                action: () => setUserRoleAction({ userId, role: "user" }),
              })
            }
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
                onClick={() =>
                  askConfirm({
                    kind: "revoke",
                    message: t("moderation.confirmRevoke"),
                    action: () => revokeSessionAction({ userId, sessionId: row.id }),
                  })
                }
              >
                {t("moderation.revoke")}
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}

      <Dialog
        open={confirm != null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("moderation.confirmTitle")}</DialogTitle>
            <DialogDescription>{confirm?.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setConfirm(null)}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant={confirm?.kind === "ban" || confirm?.kind === "revoke" ? "primary" : "secondary"}
              onClick={onConfirm}
            >
              {tCommon("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
