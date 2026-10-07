"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { ConfigState } from "@/components/Dashboard";

export default function SettingsModal({
  config,
  onClose,
  onSaved,
}: {
  config: ConfigState | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [host, setHost] = useState(config?.host ?? "");
  const [port, setPort] = useState(String(config?.port ?? 7575));
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port, pin }),
      });
      const res = await r.json();
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        setError(res.error || "Connexion impossible");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="mrd-fade w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Connexion au téléphone</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-slate-500">
            Lancez le serveur dans l&apos;application sur le téléphone : l&apos;adresse IP et le
            code de connexion s&apos;affichent à l&apos;écran.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Adresse IP</label>
              <input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.12"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs font-medium text-slate-600">Port</label>
              <input
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Code de connexion (PIN)
            </label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={config?.pinSet ? "•••• (inchangé si vide)" : "1234"}
              inputMode="numeric"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving || !host}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="mrd-spin" />}
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
