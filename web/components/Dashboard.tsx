"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MessageSquare,
  Users,
  Phone,
  FolderClosed,
  LayoutGrid,
  Wrench,
  Settings,
  Smartphone,
  Circle,
} from "lucide-react";
import SmsPanel from "@/components/panels/SmsPanel";
import ContactsPanel from "@/components/panels/ContactsPanel";
import CallsPanel from "@/components/panels/CallsPanel";
import FilesPanel from "@/components/panels/FilesPanel";
import AppsPanel from "@/components/panels/AppsPanel";
import ToolsPanel from "@/components/panels/ToolsPanel";
import SettingsModal from "@/components/SettingsModal";

type TabId = "sms" | "contacts" | "calls" | "files" | "apps" | "tools";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "calls", label: "Appels", icon: Phone },
  { id: "files", label: "Fichiers", icon: FolderClosed },
  { id: "apps", label: "Applications", icon: LayoutGrid },
  { id: "tools", label: "Outils", icon: Wrench },
];

export type ConfigState = {
  host: string;
  port: number;
  pinSet: boolean;
  connected: boolean;
  error?: string;
};

export default function Dashboard() {
  const [tab, setTab] = useState<TabId>("sms");
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.id === t)) setTab(t as TabId);
  }, [refreshConfig]);

  const connected = config?.connected ?? false;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-16 shrink-0 flex-col bg-slate-900 text-slate-300 md:w-60">
        <div className="flex h-16 items-center gap-2 px-4 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)]">
            <Smartphone size={20} />
          </div>
          <span className="hidden text-lg font-semibold tracking-tight md:block">
            MyRemoteDroid
          </span>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title={t.label}
              >
                <Icon size={20} className="shrink-0" />
                <span className="hidden md:block">{t.label}</span>
              </button>
            );
          })}
        </nav>
        <button
          onClick={() => setSettingsOpen(true)}
          className="m-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          title="Paramètres"
        >
          <Settings size={20} className="shrink-0" />
          <span className="hidden md:block">Paramètres</span>
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-slate-800">
            {TABS.find((t) => t.id === tab)?.label}
          </h1>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100"
          >
            <Circle
              size={10}
              className={connected ? "fill-green-500 text-green-500" : "fill-red-500 text-red-500"}
            />
            {config?.host
              ? `${config.host}:${config.port}`
              : "Non configuré"}
          </button>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50">
          {!connected ? (
            <div className="mrd-fade flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                <Smartphone size={30} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-800">
                Téléphone non connecté
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                {config?.error
                  ? `Erreur : ${config.error}`
                  : "Renseignez l'adresse IP du téléphone et le code de connexion affichés dans l'application."}
              </p>
              <button
                onClick={() => setSettingsOpen(true)}
                className="mt-5 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)]"
              >
                Configurer la connexion
              </button>
            </div>
          ) : (
            <div key={tab} className="mrd-fade h-full">
              {tab === "sms" && <SmsPanel />}
              {tab === "contacts" && <ContactsPanel />}
              {tab === "calls" && <CallsPanel />}
              {tab === "files" && <FilesPanel />}
              {tab === "apps" && <AppsPanel />}
              {tab === "tools" && <ToolsPanel />}
            </div>
          )}
        </main>
      </div>

      {settingsOpen && (
        <SettingsModal
          config={config}
          onClose={() => setSettingsOpen(false)}
          onSaved={refreshConfig}
        />
      )}
    </div>
  );
}
