"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Send, Plus, RefreshCw, Loader2 } from "lucide-react";
import { phoneGet, phonePost, phoneAsset, okOf, asArray } from "@/lib/api";
import { Loading, EmptyState } from "@/components/ui";

type Thread = {
  id: number;
  addr: string;
  name: string;
  contactId: number;
  date: number;
  count: number;
  body: string;
  img: string;
  unread: number;
};

type Message = {
  sent: boolean;
  timest: number;
  number: string;
  date: string;
  message: string;
};

function Avatar({ img, label }: { img?: string; label: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-500">
      {img ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={phoneAsset("/" + img)} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
      ) : (
        label.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export default function SmsPanel() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [composeTo, setComposeTo] = useState<string>("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [newMode, setNewMode] = useState(false);

  const loadThreads = useCallback(async () => {
    setThreads(null);
    const data = asArray<Thread>(await phoneGet("/datas/sms/threads.xhtml"));
    setThreads(data);
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  async function openThread(t: Thread) {
    setNewMode(false);
    setSelected(t);
    setMessages(null);
    const res = await phoneGet("/datas/sms/show_thread.xhtml?threadId=" + t.id);
    const arr = asArray<{ messages: Message[] }>(res);
    setMessages(arr[0]?.messages ?? []);
  }

  async function send() {
    const number = newMode ? composeTo : selected?.addr;
    if (!number || !text.trim()) return;
    setSending(true);
    const r = okOf(await phonePost("/datas/sms/send_sms.xhtml", { number, message: text }));
    setSending(false);
    if (r.success) {
      setText("");
      if (newMode) {
        setNewMode(false);
        await loadThreads();
      } else if (selected) {
        await openThread(selected);
      }
    }
  }

  return (
    <div className="flex h-full">
      {/* Threads list */}
      <div className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-3">
          <button
            onClick={() => {
              setNewMode(true);
              setSelected(null);
              setMessages(null);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--accent-dark)]"
          >
            <Plus size={16} /> Nouveau
          </button>
          <button onClick={loadThreads} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Actualiser">
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {threads === null ? (
            <Loading />
          ) : threads.length === 0 ? (
            <EmptyState icon={<MessageSquare size={28} />} title="Aucune conversation" />
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => openThread(t)}
                className={`flex w-full items-center gap-3 border-b border-slate-50 px-3 py-3 text-left hover:bg-slate-50 ${
                  selected?.id === t.id ? "bg-sky-50" : ""
                }`}
              >
                <Avatar img={t.img} label={t.name !== "null" ? t.name : t.addr} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium text-slate-800">
                      {t.name !== "null" ? t.name : t.addr}
                    </span>
                    {t.unread > 0 && (
                      <span className="ml-2 rounded-full bg-[var(--accent)] px-1.5 text-xs text-white">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{t.body}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex min-w-0 flex-1 flex-col bg-slate-50">
        {!selected && !newMode ? (
          <EmptyState icon={<MessageSquare size={32} />} title="Sélectionnez une conversation" hint="ou créez un nouveau message" />
        ) : (
          <>
            <div className="border-b border-slate-200 bg-white px-5 py-3">
              {newMode ? (
                <input
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="Numéro du destinataire"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              ) : (
                <div className="font-medium text-slate-800">
                  {selected?.name !== "null" ? selected?.name : selected?.addr}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2 overflow-auto p-5">
              {!newMode && messages === null ? (
                <Loading />
              ) : (
                messages?.map((m, i) => (
                  <div key={i} className={`flex ${m.sent ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        m.sent ? "bg-[var(--accent)] text-white" : "bg-white text-slate-800 shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      <p className={`mt-1 text-[10px] ${m.sent ? "text-white/70" : "text-slate-400"}`}>{m.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Votre message…"
                className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-white hover:bg-[var(--accent-dark)] disabled:opacity-50"
              >
                {sending ? <Loader2 size={18} className="mrd-spin" /> : <Send size={18} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
