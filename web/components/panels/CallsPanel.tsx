"use client";

import { useCallback, useEffect, useState } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, RefreshCw, Trash2 } from "lucide-react";
import { phoneGet, asArray } from "@/lib/api";
import { useApp } from "@/components/providers/AppProvider";
import PageTitle from "@/components/layout/PageTitle";
import { Loading, EmptyState } from "@/components/ui";

type Call = {
  callId: number;
  number: string;
  name: string;
  date: string;
  datetime: string;
  duration: string;
  type: string;
};

function TypeBadge({ type }: { type: string }) {
  if (type?.includes("missed"))
    return <span className="badge bg-danger-subtle text-danger d-inline-flex align-items-center gap-1"><PhoneMissed size={13} /></span>;
  if (type?.includes("outgoing"))
    return <span className="badge bg-info-subtle text-info d-inline-flex align-items-center gap-1"><PhoneOutgoing size={13} /></span>;
  return <span className="badge bg-success-subtle text-success d-inline-flex align-items-center gap-1"><PhoneIncoming size={13} /></span>;
}

export default function CallsPanel() {
  const { t, notify } = useApp();
  const [calls, setCalls] = useState<Call[] | null>(null);

  const load = useCallback(async () => {
    setCalls(null);
    setCalls(asArray<Call>(await phoneGet("/datas/call/call_log.xhtml")));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    await phoneGet("/datas/call/delete_call.xhtml?callId=" + id);
    notify("success", t("calls.deleted"));
    load();
  }

  return (
    <>
      <PageTitle
        icon="pe-7s-call"
        iconBg="bg-grow-early"
        title={t("nav.calls")}
        subtitle={calls ? `${calls.length} ${t("nav.calls").toLowerCase()}` : undefined}
        actions={
          <button className="btn btn-light d-inline-flex align-items-center gap-2" onClick={load}>
            <RefreshCw size={16} /> {t("common.refresh")}
          </button>
        }
      />

      {calls === null ? (
        <Loading />
      ) : calls.length === 0 ? (
        <EmptyState icon={<Phone size={28} />} title={t("calls.empty")} />
      ) : (
        <div className="card mb-3">
          <div className="table-responsive">
            <table className="align-middle mb-0 table table-striped table-hover">
              <thead>
                <tr>
                  <th className="text-center">{t("calls.type")}</th>
                  <th>{t("calls.contact")}</th>
                  <th>{t("calls.date")}</th>
                  <th>{t("calls.duration")}</th>
                  <th className="text-end">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr key={c.callId}>
                    <td className="text-center">
                      <TypeBadge type={c.type} />
                    </td>
                    <td>
                      <span className="fw-semibold">{c.name && c.name !== "null" ? c.name : c.number}</span>
                      {c.name && c.name !== "null" && <span className="ms-2 small text-muted">{c.number}</span>}
                    </td>
                    <td className="text-muted">{c.date}</td>
                    <td className="text-muted">{c.duration}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(c.callId)} title={t("common.delete")}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
