"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDemoState, subscribeDemoStore } from "@/lib/demo/store";
import type { DemoSession, DemoStoreState } from "@/lib/demo/types";

type DemoContextValue = {
  ready: boolean;
  session: DemoSession | null;
  state: DemoStoreState;
  refresh: () => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<DemoStoreState>(() => ({
    session: null,
    users: [],
    favorites: [],
    activity: [],
    pendingEmail: null,
  }));

  const refresh = useCallback(() => {
    setState(getDemoState());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    return subscribeDemoStore(refresh);
  }, [refresh]);

  const value = useMemo(
    () => ({
      ready,
      session: state.session,
      state,
      refresh,
    }),
    [ready, refresh, state],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return ctx;
}
