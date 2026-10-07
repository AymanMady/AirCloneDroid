"use client";

/**
 * Central client state for the whole app:
 *  - ArchitectUI layout/theme options (fixed header/sidebar/footer, collapsed
 *    sidebar, dark mode, header & sidebar colour schemes), persisted per viewer
 *    to localStorage.
 *  - Active language + a `t()` translator.
 *  - A lightweight toast queue.
 *  - The phone connection state (host/port/pin/connected) and the Settings
 *    modal open flag, refreshed from /api/config.
 *
 * Browser storage is wrapped in try/catch and the app renders correctly when it
 * is empty or unavailable (private windows, blocked site data).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { translate, type Lang } from "@/lib/i18n";

export type ThemeOptions = {
  fixedHeader: boolean;
  fixedSidebar: boolean;
  fixedFooter: boolean;
  closedSidebar: boolean;
  dark: boolean;
  headerScheme: string; // ArchitectUI bg classes, "" = default white
  sidebarScheme: string;
};

export type ConfigState = {
  host: string;
  port: number;
  pinSet: boolean;
  connected: boolean;
  demo?: boolean;
  error?: string;
};

export type Toast = {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
};

const DEFAULT_THEME: ThemeOptions = {
  fixedHeader: true,
  fixedSidebar: true,
  fixedFooter: false,
  closedSidebar: false,
  dark: false,
  headerScheme: "",
  sidebarScheme: "",
};

const THEME_KEY = "mrd.theme.v1";
const LANG_KEY = "mrd.lang.v1";

type Ctx = {
  theme: ThemeOptions;
  setTheme: (patch: Partial<ThemeOptions>) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
  toasts: Toast[];
  notify: (kind: Toast["kind"], message: string) => void;
  dismiss: (id: number) => void;
  config: ConfigState | null;
  refreshConfig: () => Promise<void>;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
};

const AppContext = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const c = useContext(AppContext);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeOptions>(DEFAULT_THEME);
  const [lang, setLangState] = useState<Lang>("fr");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const toastId = useRef(0);

  // Load persisted preferences once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(THEME_KEY);
      if (raw) setThemeState({ ...DEFAULT_THEME, ...JSON.parse(raw) });
    } catch {}
    try {
      const l = localStorage.getItem(LANG_KEY);
      if (l === "fr" || l === "en") setLangState(l);
    } catch {}
  }, []);

  // Keep <html> attributes in sync for native dark form controls / scrollbars.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme.dark ? "dark" : "light");
    document.documentElement.lang = lang;
  }, [theme.dark, lang]);

  const setTheme = useCallback((patch: Partial<ThemeOptions>) => {
    setThemeState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(THEME_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => translate(lang, key, vars),
    [lang]
  );

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (kind: Toast["kind"], message: string) => {
      const id = ++toastId.current;
      setToasts((ts) => [...ts, { id, kind, message }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const refreshConfig = useCallback(async () => {
    try {
      const r = await fetch("/api/config", { cache: "no-store" });
      const c: ConfigState = await r.json();
      setConfig(c);
      if (!c.host) setSettingsOpen(true);
    } catch {
      setConfig({ host: "", port: 7575, pinSet: false, connected: false });
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      setTheme,
      lang,
      setLang,
      t,
      toasts,
      notify,
      dismiss,
      config,
      refreshConfig,
      settingsOpen,
      setSettingsOpen,
      mobileNavOpen,
      setMobileNavOpen,
    }),
    [theme, setTheme, lang, setLang, t, toasts, notify, dismiss, config, refreshConfig, settingsOpen, mobileNavOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
