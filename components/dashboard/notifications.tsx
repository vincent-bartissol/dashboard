"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export type NotificationTone = "status" | "danger";

export type NotifyInput = {
  tone: NotificationTone;
  message: string;
};

type NotificationItem = NotifyInput & {
  id: string;
};

type NotificationContextValue = {
  notify: (input: NotifyInput) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const AUTO_DISMISS_MS = 5_000;

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotify must be used within NotificationProvider");
  }
  return ctx.notify;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("Common");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const idPrefix = useId();
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (input: NotifyInput) => {
      counter.current += 1;
      const id = `${idPrefix}-${counter.current}`;
      setItems((prev) => [...prev, { id, tone: input.tone, message: input.message }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss, idPrefix],
  );

  useEffect(() => {
    const active = timers.current;
    return () => {
      for (const timer of active.values()) clearTimeout(timer);
      active.clear();
    };
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <section
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-2 p-4 sm:p-6"
        aria-label={t("notifications")}
      >
        {items.map((item) => {
          const toastClassName =
            "pointer-events-auto flex max-w-sm items-start gap-3 border border-line bg-paper p-3 shadow-[0_12px_32px_-22px_rgba(15,28,42,0.55)]";
          const messageClassName = `min-w-0 flex-1 text-sm ${
            item.tone === "danger" ? "text-danger" : "text-muted"
          }`;
          const dismissButton = (
            <button
              type="button"
              className="shrink-0 text-muted transition hover:text-heading focus-field"
              aria-label={t("dismissNotification")}
              onClick={() => dismiss(item.id)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          );

          if (item.tone === "danger") {
            return (
              <div key={item.id} role="alert" className={toastClassName}>
                <p className={messageClassName}>{item.message}</p>
                {dismissButton}
              </div>
            );
          }

          return (
            <output key={item.id} aria-live="polite" className={toastClassName}>
              <p className={messageClassName}>{item.message}</p>
              {dismissButton}
            </output>
          );
        })}
      </section>
    </NotificationContext.Provider>
  );
}
