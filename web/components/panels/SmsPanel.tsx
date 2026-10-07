"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Send, Plus, RefreshCw, Loader2 } from "lucide-react";
import { phoneGet, phonePost, phoneAsset, okOf, asArray } from "@/lib/api";
import { useApp } from "@/components/providers/AppProvider";
import PageTitle from "@/components/layout/PageTitle";
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

type Message = { sent: boolean; timest: number; number: string; date: string; message: string };

function Avatar({ img, label }: { img?: string; label: string }) {
  return (
    <span
      className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold overflow-hidden flex-shrink-0"
      style={{ width: 42, height: 42 }}
    >
      {img ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={phoneAsset("/" + img)} alt="" className="w-100 h-100" style={{ objectFit: "cover" }} onError={(e) => (e.currentTarget.style.display = "none")} />
      ) : (
        label.charAt(0).toUpperCase()
      )}
    </span>
  );
}

export default function SmsPanel() {
  const { t, notify } = useApp();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [composeTo, setComposeTo] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [newMode, setNewMode] = useState(false);
  const [query, setQuery] = useState("");

  const loadThreads = useCallback(async () => {
    setThreads(null);
    setThreads(asArray<Thread>(await phoneGet("/datas/sms/threads.xhtml")));
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  async function openThread(th: Thread) {
    setNewMode(false);
    setSelected(th);
    setMessages(null);
    const res = await phoneGet("/datas/sms/show_thread.xhtml?threadId=" + th.id);
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
      notify("success", t("sms.sent"));
      setText("");
      if (newMode) {
        setNewMode(false);
        await loadThreads();
      } else if (selected) {
        await openThread(selected);
      }
    } else {
      notify("error", r.error || t("common.error"));
    }
  }

  const filtered = (threads ?? []).filter((th) => {
    const label = th.name !== "null" ? th.name : th.addr;
    return label.toLowerCase().includes(query.toLowerCase()) || th.addr.includes(query);
  });

  return (
    <>
      <PageTitle icon="pe-7s-mail" iconBg="bg-midnight-bloom" title={t("nav.sms")} subtitle={t("app.tagline")} />
      <div className="card mb-3" style={{ height: "calc(100vh - 230px)", minHeight: 420 }}>
        <div className="row g-0 h-100">
          {/* threads */}
          <div className="col-md-4 border-end d-flex flex-column h-100">
            <div className="p-2 border-bottom d-flex gap-2">
              <button
                className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                onClick={() => {
                  setNewMode(true);
                  setSelected(null);
                  setMessages(null);
                }}
              >
                <Plus size={15} /> {t("sms.new")}
              </button>
              <input
                className="form-control form-control-sm"
                placeholder={t("common.search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="btn btn-light btn-sm" onClick={loadThreads}>
                <RefreshCw size={15} />
              </button>
            </div>
            <div className="flex-grow-1 overflow-auto">
              {threads === null ? (
                <Loading />
              ) : filtered.length === 0 ? (
                <EmptyState icon={<MessageSquare size={28} />} title={t("sms.noThreads")} />
              ) : (
                <div className="list-group list-group-flush">
                  {filtered.map((th) => {
                    const label = th.name !== "null" ? th.name : th.addr;
                    return (
                      <button
                        key={th.id}
                        onClick={() => openThread(th)}
                        className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${selected?.id === th.id ? "active" : ""}`}
                      >
                        <Avatar img={th.img} label={label} />
                        <div className="flex-grow-1 min-w-0 text-start">
                          <div className="d-flex justify-content-between">
                            <span className="fw-semibold text-truncate">{label}</span>
                            {th.unread > 0 && <span className="badge bg-primary rounded-pill">{th.unread}</span>}
                          </div>
                          <div className="small text-truncate opacity-75">{th.body}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* conversation */}
          <div className="col-md-8 d-flex flex-column h-100">
            {!selected && !newMode ? (
              <EmptyState icon={<MessageSquare size={34} />} title={t("sms.select")} hint={t("sms.selectHint")} />
            ) : (
              <>
                <div className="p-3 border-bottom">
                  {newMode ? (
                    <input
                      className="form-control"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder={t("sms.recipient")}
                    />
                  ) : (
                    <span className="fw-bold">{selected?.name !== "null" ? selected?.name : selected?.addr}</span>
                  )}
                </div>
                <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2">
                  {!newMode && messages === null ? (
                    <Loading />
                  ) : (
                    messages?.map((m, i) => (
                      <div key={i} className={`d-flex ${m.sent ? "justify-content-end" : "justify-content-start"}`}>
                        <div className={`mrd-bubble ${m.sent ? "mrd-bubble-out" : "mrd-bubble-in"}`}>
                          <div style={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: m.message }} />
                          <div className={`mt-1 ${m.sent ? "text-white-50" : "text-muted"}`} style={{ fontSize: 10 }}>
                            {m.date}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-top d-flex gap-2">
                  <input
                    className="form-control rounded-pill"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={t("sms.placeholder")}
                  />
                  <button
                    className="btn btn-primary rounded-circle d-inline-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 42, height: 42 }}
                    disabled={sending || !text.trim()}
                    onClick={send}
                  >
                    {sending ? <Loader2 size={18} className="mrd-spin" /> : <Send size={18} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
