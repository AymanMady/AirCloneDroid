"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { Modal } from "@/components/ui";

export default function SettingsModal() {
  const { config, refreshConfig, setSettingsOpen, notify, t } = useApp();
  const [host, setHost] = useState(config?.host ?? "");
  const [port, setPort] = useState(String(config?.port ?? 7575));
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => setSettingsOpen(false);

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
        await refreshConfig();
        notify("success", t("header.connected"));
        close();
      } else {
        setError(res.error || t("conn.failed"));
      }
    } catch {
      setError(t("conn.network"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={t("conn.title")}
      onClose={close}
      footer={
        <>
          <button className="btn btn-light" onClick={close}>
            {t("common.cancel")}
          </button>
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={saving || !host} onClick={save}>
            {saving && <Loader2 size={16} className="mrd-spin" />}
            {t("conn.connect")}
          </button>
        </>
      }
    >
      <p className="text-muted small">{t("conn.help")}</p>
      <div className="row g-3">
        <div className="col-8">
          <label className="form-label small fw-semibold">{t("conn.ip")}</label>
          <input
            className="form-control"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="192.168.1.12"
          />
        </div>
        <div className="col-4">
          <label className="form-label small fw-semibold">{t("conn.port")}</label>
          <input className="form-control" value={port} onChange={(e) => setPort(e.target.value)} />
        </div>
        <div className="col-12">
          <label className="form-label small fw-semibold">{t("conn.pin")}</label>
          <input
            className="form-control"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            placeholder={config?.pinSet ? t("conn.pinUnchanged") : "1234"}
          />
        </div>
      </div>
      {error && <p className="text-danger small mt-3 mb-0">{error}</p>}
    </Modal>
  );
}
