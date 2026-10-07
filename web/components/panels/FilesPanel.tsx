"use client";

import { useCallback, useEffect, useState } from "react";
import { Folder, File as FileIcon, Download, RefreshCw, ChevronRight, Home } from "lucide-react";
import { phoneGet, phoneAsset, asArray } from "@/lib/api";
import { Loading, EmptyState } from "@/components/ui";

type Entry = {
  Filetype: "dir" | "file";
  Extension: string | null;
  Modified: string;
  Size: string | null;
  Preview: string;
  Filename: string;
  Path: string;
};

const ROOT = "/sdcard/";

function humanSize(bytes: string | null): string {
  if (!bytes) return "";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "";
  if (n > 1e6) return (n / 1e6).toFixed(1) + " Mo";
  if (n > 1e3) return (n / 1e3).toFixed(0) + " Ko";
  return n + " o";
}

export default function FilesPanel() {
  const [dir, setDir] = useState(ROOT);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    setEntries(null);
    setError(null);
    const res = await phoneGet("/datas/filemanagement/jqueryFileTree.xhtml?dir=" + encodeURIComponent(d));
    const arr = asArray<Entry>(res);
    if (!Array.isArray(res)) setError("Dossier illisible ou accès refusé.");
    // dirs first, then files, alphabetical
    arr.sort((a, b) => {
      if (a.Filetype !== b.Filetype) return a.Filetype === "dir" ? -1 : 1;
      return a.Filename.localeCompare(b.Filename);
    });
    setEntries(arr);
  }, []);

  useEffect(() => {
    load(dir);
  }, [dir, load]);

  const segments = dir.replace(/\/+$/, "").split("/").filter(Boolean);

  function downloadUrl(e: Entry) {
    const qs = new URLSearchParams({
      file: e.Path,
      name: e.Filename,
      mime: "application/octet-stream",
    }).toString();
    return phoneAsset("/datas/filemanagement/get_file.xhtml?" + qs);
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
          <button onClick={() => setDir(ROOT)} className="rounded p-1 hover:bg-slate-200" title="Racine">
            <Home size={16} />
          </button>
          {segments.map((seg, i) => {
            const path = "/" + segments.slice(0, i + 1).join("/") + "/";
            return (
              <span key={i} className="flex items-center gap-1">
                <ChevronRight size={14} className="text-slate-300" />
                <button onClick={() => setDir(path)} className="rounded px-1.5 py-0.5 hover:bg-slate-200">
                  {seg}
                </button>
              </span>
            );
          })}
        </div>
        <button onClick={() => load(dir)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-100">
          <RefreshCw size={16} />
        </button>
      </div>

      {entries === null ? (
        <Loading />
      ) : error ? (
        <EmptyState icon={<Folder size={28} />} title={error} />
      ) : entries.length === 0 ? (
        <EmptyState icon={<Folder size={28} />} title="Dossier vide" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {entries.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0 hover:bg-slate-50"
            >
              {e.Filetype === "dir" ? (
                <button onClick={() => setDir(e.Path)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Folder size={20} className="shrink-0 text-amber-400" />
                  <span className="truncate font-medium text-slate-700">{e.Filename}</span>
                </button>
              ) : (
                <>
                  <FileIcon size={20} className="shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-slate-700">{e.Filename}</p>
                    <p className="text-xs text-slate-400">
                      {humanSize(e.Size)} · {e.Modified}
                    </p>
                  </div>
                  <a
                    href={downloadUrl(e)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-[var(--accent)]"
                    title="Télécharger"
                  >
                    <Download size={18} />
                  </a>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
