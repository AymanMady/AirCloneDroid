"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, RefreshCw, Download } from "lucide-react";
import { phoneGet, phoneAsset, asArray } from "@/lib/api";
import { useApp } from "@/components/providers/AppProvider";
import PageTitle from "@/components/layout/PageTitle";
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
  const { t } = useApp();
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
    <>
      <PageTitle
        icon="pe-7s-display2"
        iconBg="bg-premium-dark"
        title={t("nav.apps")}
        subtitle={apps ? `${apps.length} applications` : undefined}
        actions={
          <button className="btn btn-light d-inline-flex align-items-center gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </button>
        }
      />

      <div className="mb-3">
        <input className="form-control" placeholder={t("apps.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {apps === null ? (
        <Loading label={t("apps.loading")} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<LayoutGrid size={28} />} title={t("apps.none")} />
      ) : (
        <div className="row">
          {filtered.map((a, i) => (
            <div key={i} className="col-md-6 col-xl-4">
              <div className="card mb-3">
                <div className="card-body d-flex align-items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={phoneAsset("/" + a.icon)}
                    alt=""
                    width={44}
                    height={44}
                    className="rounded flex-shrink-0"
                    onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                  />
                  <div className="min-w-0 flex-grow-1">
                    <div className="fw-semibold text-truncate">{a.name}</div>
                    <div className="small text-muted">
                      v{a.version} · {humanSize(a.size)}
                    </div>
                  </div>
                  <a className="btn btn-sm btn-light" href={phoneAsset("/" + a.download)} title={t("apps.downloadApk")}>
                    <Download size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
