"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, RefreshCw, Download } from "lucide-react";
import { phoneGet, phoneAsset, asArray } from "@/lib/api";
import { Loading, EmptyState } from "@/components/ui";

type App = {
  name: string;
  version: string;
  installDate: string;
  size: string;
  location: string;
  icon: string;
  download: string;
};

function humanSize(bytes: string): string {
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "";
  if (n > 1e6) return (n / 1e6).toFixed(1) + " Mo";
  if (n > 1e3) return (n / 1e3).toFixed(0) + " Ko";
  return n + " o";
}

export default function AppsPanel() {
  const [apps, setApps] = useState<App[] | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setApps(null);
    setApps(asArray<App>(await phoneGet("/datas/application/applications_list.xhtml")));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (apps ?? []).filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une application…"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button onClick={load} className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-100">
          <RefreshCw size={16} />
        </button>
      </div>

      {apps === null ? (
        <Loading label="Chargement des applications (peut prendre quelques secondes)…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<LayoutGrid size={28} />} title="Aucune application" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={phoneAsset("/" + a.icon)}
                alt=""
                className="h-11 w-11 shrink-0 rounded-lg"
                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{a.name}</p>
                <p className="text-xs text-slate-400">
                  v{a.version} · {humanSize(a.size)}
                </p>
              </div>
              <a
                href={phoneAsset("/" + a.download)}
                className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-[var(--accent)]"
                title="Télécharger l'APK"
              >
                <Download size={18} />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
