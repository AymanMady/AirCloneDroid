"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { phoneGet, asArray } from "@/lib/api";
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

function typeIcon(type: string) {
  if (type?.includes("missed")) return <PhoneMissed size={18} className="text-red-500" />;
  if (type?.includes("outgoing")) return <PhoneOutgoing size={18} className="text-sky-500" />;
  if (type?.includes("incoming") || type?.includes("received"))
    return <PhoneIncoming size={18} className="text-green-500" />;
  return <Phone size={18} className="text-slate-400" />;
}

export default function CallsPanel() {
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
    load();
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex justify-end">
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {calls === null ? (
        <Loading />
      ) : calls.length === 0 ? (
        <EmptyState icon={<Phone size={28} />} title="Journal d'appels vide" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Numéro / Contact</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Durée</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr key={c.callId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">{typeIcon(c.type)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">
                      {c.name && c.name !== "null" ? c.name : c.number}
                    </span>
                    {c.name && c.name !== "null" && (
                      <span className="ml-2 text-xs text-slate-400">{c.number}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.date}</td>
                  <td className="px-4 py-3 text-slate-500">{c.duration}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(c.callId)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
