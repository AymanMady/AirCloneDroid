"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Users,
  Phone,
  LayoutGrid,
  BatteryCharging,
  Battery,
  Wifi,
  MemoryStick,
  RefreshCw,
  Camera,
  FolderClosed,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
} from "lucide-react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useApp } from "@/components/providers/AppProvider";
import PageTitle from "@/components/layout/PageTitle";
import { Loading } from "@/components/ui";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type Data = {
  battery: { percent: number; charging: boolean } | null;
  memory: { available: string } | null;
  wifi: { name: string; strength: number; linkspeed: string } | null;
  counts: { sms: number; contacts: number; calls: number; apps: number };
  callsByType: { incoming: number; outgoing: number; missed: number };
  recentCalls: { number: string; name: string; date: string; duration: string; type: string; callId: number }[];
  recentSms: { id: number; addr: string; name: string; body: string; unread: number }[];
};

export default function DashboardView() {
  const { t, theme, config } = useApp();
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/dashboard", { cache: "no-store" });
      setData(await r.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tick = theme.dark ? "#8b93a7" : "#6c757d";

  return (
    <>
      <PageTitle
        icon="pe-7s-graph3"
        iconBg="bg-mean-fruit"
        title={t("dash.title")}
        subtitle={t("dash.subtitle")}
        actions={
          <button className="btn btn-outline-primary d-inline-flex align-items-center gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </button>
        }
      />

      {loading && !data ? (
        <Loading />
      ) : !data ? (
        <div className="alert alert-danger">{t("common.error")}</div>
      ) : (
        <div className="mrd-fade">
          {/* stat cards */}
          <div className="row">
            <StatCard bg="bg-midnight-bloom" icon={<MessageSquare size={26} />} value={data.counts.sms} label={t("dash.smsCount")} onClick={() => router.push("/sms")} />
            <StatCard bg="bg-arielle-smile" icon={<Users size={26} />} value={data.counts.contacts} label={t("dash.contactsCount")} onClick={() => router.push("/contacts")} />
            <StatCard bg="bg-grow-early" icon={<Phone size={26} />} value={data.counts.calls} label={t("dash.callsCount")} onClick={() => router.push("/calls")} />
            <StatCard bg="bg-premium-dark" icon={<LayoutGrid size={26} />} value={data.counts.apps || "—"} label={t("dash.appsCount")} onClick={() => router.push("/apps")} />
          </div>

          {/* device status */}
          <div className="row">
            <div className="col-md-4">
              <DeviceCard title={t("dash.battery")} icon={data.battery?.charging ? <BatteryCharging size={20} /> : <Battery size={20} />}>
                {data.battery ? (
                  <>
                    <div className="d-flex align-items-end gap-2">
                      <span className="display-6 fw-bold">{data.battery.percent}%</span>
                      <span className={`badge ${data.battery.charging ? "bg-success" : "bg-secondary"} mb-2`}>
                        {data.battery.charging ? t("dash.charging") : t("dash.notCharging")}
                      </span>
                    </div>
                    <div className="progress mt-2" style={{ height: 8 }}>
                      <div
                        className={`progress-bar ${data.battery.percent < 20 ? "bg-danger" : "bg-success"}`}
                        style={{ width: `${data.battery.percent}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </DeviceCard>
            </div>
            <div className="col-md-4">
              <DeviceCard title={t("dash.memory")} icon={<MemoryStick size={20} />}>
                <span className="display-6 fw-bold">{data.memory?.available || "—"}</span>
                <div className="text-muted small mt-2">RAM disponible</div>
              </DeviceCard>
            </div>
            <div className="col-md-4">
              <DeviceCard title={t("dash.wifi")} icon={<Wifi size={20} />}>
                <div className="fw-bold text-truncate" style={{ fontSize: "1.35rem" }}>
                  {data.wifi?.name || "—"}
                </div>
                <div className="progress mt-2" style={{ height: 8 }}>
                  <div className="progress-bar bg-info" style={{ width: `${data.wifi?.strength ?? 0}%` }} />
                </div>
                <div className="text-muted small mt-2">
                  {t("dash.signal")}: {data.wifi?.strength ?? 0}% · {data.wifi?.linkspeed || ""}
                </div>
              </DeviceCard>
            </div>
          </div>

          {/* charts + quick actions */}
          <div className="row">
            <div className="col-md-5">
              <div className="card mb-3">
                <div className="card-header fw-semibold">{t("dash.callsByType")}</div>
                <div className="card-body d-flex justify-content-center" style={{ height: 260 }}>
                  <Doughnut
                    data={{
                      labels: [t("calls.incoming"), t("calls.outgoing"), t("calls.missed")],
                      datasets: [
                        {
                          data: [data.callsByType.incoming, data.callsByType.outgoing, data.callsByType.missed],
                          backgroundColor: ["#3ac47d", "#30b1ff", "#d92550"],
                          borderWidth: 0,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "bottom", labels: { color: tick } } },
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-7">
              <div className="card mb-3">
                <div className="card-header fw-semibold">{t("dash.deviceInfo")}</div>
                <div className="card-body" style={{ height: 260 }}>
                  <Bar
                    data={{
                      labels: [t("dash.smsCount"), t("dash.contactsCount"), t("dash.callsCount")],
                      datasets: [
                        {
                          label: t("app.name"),
                          data: [data.counts.sms, data.counts.contacts, data.counts.calls],
                          backgroundColor: ["#3f6ad8", "#f7b924", "#16aaff"],
                          borderRadius: 6,
                        },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { color: tick }, grid: { display: false } },
                        y: { ticks: { color: tick }, grid: { color: theme.dark ? "#2a3142" : "#eef1f6" } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* recent activity */}
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-header fw-semibold">{t("dash.recentCalls")}</div>
                <div className="list-group list-group-flush">
                  {data.recentCalls.length === 0 && <div className="list-group-item text-muted small">{t("calls.empty")}</div>}
                  {data.recentCalls.map((c) => (
                    <div key={c.callId} className="list-group-item d-flex align-items-center gap-3">
                      <CallIcon type={c.type} />
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold text-truncate">{c.name && c.name !== "null" ? c.name : c.number}</div>
                        <div className="text-muted small">{c.date}</div>
                      </div>
                      <span className="text-muted small">{c.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card mb-3">
                <div className="card-header fw-semibold d-flex justify-content-between align-items-center">
                  {t("dash.recentSms")}
                  <button className="btn btn-sm btn-link text-decoration-none" onClick={() => router.push("/sms")}>
                    {t("dash.openSms")}
                  </button>
                </div>
                <div className="list-group list-group-flush">
                  {data.recentSms.length === 0 && <div className="list-group-item text-muted small">{t("sms.noThreads")}</div>}
                  {data.recentSms.map((s) => (
                    <div key={s.id} className="list-group-item d-flex align-items-center gap-3 mrd-clickable" onClick={() => router.push("/sms")}>
                      <span className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold" style={{ width: 38, height: 38 }}>
                        {(s.name !== "null" ? s.name : s.addr).charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-semibold text-truncate">{s.name !== "null" ? s.name : s.addr}</div>
                        <div className="text-muted small text-truncate">{s.body}</div>
                      </div>
                      {s.unread > 0 && <span className="badge bg-primary rounded-pill">{s.unread}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* quick actions */}
          <div className="card mb-3">
            <div className="card-header fw-semibold">{t("dash.quickActions")}</div>
            <div className="card-body d-flex flex-wrap gap-2">
              <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={() => router.push("/sms")}>
                <MessageSquare size={16} /> {t("dash.openSms")}
              </button>
              <button className="btn btn-success d-inline-flex align-items-center gap-2" onClick={() => router.push("/tools")}>
                <Camera size={16} /> {t("dash.takePhoto")}
              </button>
              <button className="btn btn-info text-white d-inline-flex align-items-center gap-2" onClick={() => router.push("/files")}>
                <FolderClosed size={16} /> {t("dash.browseFiles")}
              </button>
              <span className="ms-auto align-self-center text-muted small">
                {config?.host}:{config?.port}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatCard({
  bg,
  icon,
  value,
  label,
  onClick,
}: {
  bg: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="col-md-6 col-xl-3">
      <div className={`card mb-3 widget-content ${bg} mrd-clickable`} onClick={onClick}>
        <div className="widget-content-wrapper text-white">
          <div className="widget-content-left">
            <div className="widget-heading">{label}</div>
            <div className="widget-numbers text-white">
              <span>{value}</span>
            </div>
          </div>
          <div className="widget-content-right">
            <div className="opacity-75">{icon}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 text-muted mb-2">
          <span className="text-primary">{icon}</span>
          <span className="fw-semibold small text-uppercase">{title}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function CallIcon({ type }: { type: string }) {
  if (type?.includes("missed")) return <PhoneMissed size={18} className="text-danger" />;
  if (type?.includes("outgoing")) return <PhoneOutgoing size={18} className="text-info" />;
  return <PhoneIncoming size={18} className="text-success" />;
}
