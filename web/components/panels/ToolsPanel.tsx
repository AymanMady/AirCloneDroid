"use client";

import { useState } from "react";
import { Volume2, Camera, Mic, Video, Image as ImageIcon, Mail, Loader2 } from "lucide-react";
import { phoneGet, phonePost, phoneAsset, okOf } from "@/lib/api";
import { useApp } from "@/components/providers/AppProvider";
import PageTitle from "@/components/layout/PageTitle";

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card mb-3">
      <div className="card-header fw-semibold d-flex align-items-center gap-2">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

export default function ToolsPanel() {
  const { t } = useApp();
  return (
    <>
      <PageTitle icon="pe-7s-tools" iconBg="bg-love-kiss" title={t("nav.tools")} subtitle={t("app.tagline")} />
      <div className="row">
        <div className="col-lg-6"><TtsCard /></div>
        <div className="col-lg-6"><CameraCard /></div>
        <div className="col-lg-6"><VideoCard /></div>
        <div className="col-lg-6"><MicCard /></div>
        <div className="col-lg-6"><WallpaperCard /></div>
        <div className="col-lg-6"><EmailCard /></div>
      </div>
    </>
  );
}

function TtsCard() {
  const { t, notify } = useApp();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function speak() {
    setBusy(true);
    const r = okOf(await phonePost("/datas/tts/speak.xhtml", { text }));
    setBusy(false);
    notify(r.success ? "success" : "error", r.success ? t("tools.ttsPlaying") : r.error || t("common.error"));
  }
  return (
    <Card icon={<Volume2 size={18} />} title={t("tools.tts")}>
      <textarea className="form-control" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("tools.ttsText")} />
      <button className="btn btn-primary mt-3 d-inline-flex align-items-center gap-2" disabled={busy || !text.trim()} onClick={speak}>
        {busy && <Loader2 size={16} className="mrd-spin" />}
        {t("tools.ttsSpeak")}
      </button>
    </Card>
  );
}

function CameraCard() {
  const { t, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  async function take(front: boolean) {
    setBusy(true);
    setPhoto(null);
    const r = okOf(await phoneGet(`/datas/camera/take.xhtml?front=${front ? "1" : "0"}`));
    setBusy(false);
    if (r.success && r.file) {
      setPhoto(phoneAsset("/" + r.file) + "?t=" + Date.now());
      notify("success", t("tools.photoTaken"));
    } else {
      notify("error", r.error || t("common.error"));
    }
  }
  return (
    <Card icon={<Camera size={18} />} title={t("tools.camera")}>
      <div className="d-flex gap-2">
        <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={busy} onClick={() => take(false)}>
          {busy && <Loader2 size={16} className="mrd-spin" />}
          {t("tools.photoBack")}
        </button>
        <button className="btn btn-light" disabled={busy} onClick={() => take(true)}>
          {t("tools.photoFront")}
        </button>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo && <img src={photo} alt="" className="w-100 rounded border mt-3" />}
    </Card>
  );
}

function VideoCard() {
  const { t, notify } = useApp();
  const [recording, setRecording] = useState(false);
  const [front, setFront] = useState(false);
  const [video, setVideo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function start() {
    setBusy(true);
    setVideo(null);
    const r = okOf(await phoneGet(`/datas/video/start.xhtml?front=${front ? "1" : "0"}`));
    setBusy(false);
    if (r.success) {
      setRecording(true);
      notify("info", t("tools.videoRecording"));
    } else notify("error", r.error || t("common.error"));
  }
  async function stop() {
    setBusy(true);
    const r = okOf(await phoneGet("/datas/video/stop.xhtml"));
    setBusy(false);
    setRecording(false);
    if (r.success && r.file) {
      setVideo(phoneAsset("/" + r.file) + "?t=" + Date.now());
      notify("success", t("tools.videoSaved"));
    } else notify("error", r.error || t("common.error"));
  }
  return (
    <Card icon={<Video size={18} />} title={t("tools.video")}>
      <div className="form-check mb-3">
        <input className="form-check-input" type="checkbox" id="vfront" checked={front} disabled={recording} onChange={(e) => setFront(e.target.checked)} />
        <label className="form-check-label small" htmlFor="vfront">{t("tools.frontCamera")}</label>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={recording || busy} onClick={start}>
          {recording && <span className="spinner-grow spinner-grow-sm" />}
          {recording ? t("tools.recording") : t("tools.start")}
        </button>
        <button className="btn btn-light" disabled={!recording || busy} onClick={stop}>{t("tools.stop")}</button>
      </div>
      {video && (
        <video controls src={video} className="w-100 rounded border mt-3">
          <track kind="captions" />
        </video>
      )}
    </Card>
  );
}

function MicCard() {
  const { t, notify } = useApp();
  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState<string | null>(null);
  async function start() {
    setAudio(null);
    const r = okOf(await phoneGet("/datas/mic/start.xhtml"));
    if (r.success) {
      setRecording(true);
      notify("info", t("tools.recStarted"));
    } else notify("error", r.error || t("common.error"));
  }
  async function stop() {
    const r = okOf(await phoneGet("/datas/mic/stop.xhtml"));
    setRecording(false);
    if (r.success && r.file) {
      setAudio(phoneAsset("/" + r.file) + "?t=" + Date.now());
      notify("success", t("tools.recDone"));
    } else notify("error", r.error || t("common.error"));
  }
  return (
    <Card icon={<Mic size={18} />} title={t("tools.mic")}>
      <div className="d-flex gap-2">
        <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={recording} onClick={start}>
          {recording && <span className="spinner-grow spinner-grow-sm" />}
          {recording ? t("tools.recording") : t("tools.start")}
        </button>
        <button className="btn btn-light" disabled={!recording} onClick={stop}>{t("tools.stop")}</button>
      </div>
      {audio && <audio controls src={audio} className="w-100 mt-3"><track kind="captions" /></audio>}
    </Card>
  );
}

function WallpaperCard() {
  const { t, notify } = useApp();
  const [path, setPath] = useState("");
  const [busy, setBusy] = useState(false);
  async function apply() {
    setBusy(true);
    const r = okOf(await phonePost("/datas/wallpaper/set.xhtml", { path }));
    setBusy(false);
    notify(r.success ? "success" : "error", r.success ? t("tools.wallpaperSet") : r.error || t("common.error"));
  }
  return (
    <Card icon={<ImageIcon size={18} />} title={t("tools.wallpaper")}>
      <input className="form-control" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/sdcard/Pictures/photo.jpg" />
      <p className="small text-muted mt-1 mb-0">{t("tools.wallpaperHint")}</p>
      <button className="btn btn-primary mt-3 d-inline-flex align-items-center gap-2" disabled={busy || !path.trim()} onClick={apply}>
        {busy && <Loader2 size={16} className="mrd-spin" />}
        {t("tools.apply")}
      </button>
    </Card>
  );
}

function EmailCard() {
  const { t, notify } = useApp();
  const [f, setF] = useState({ host: "", port: "465", user: "", pass: "", to: "", subject: "", body: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });
  async function send() {
    setBusy(true);
    const r = okOf(await phonePost("/datas/email/send.xhtml", f));
    setBusy(false);
    notify(r.success ? "success" : "error", r.success ? t("tools.emailSent") : r.error || t("common.error"));
  }
  return (
    <Card icon={<Mail size={18} />} title={t("tools.email")}>
      <div className="row g-2">
        <div className="col-8"><input className="form-control" value={f.host} onChange={set("host")} placeholder="smtp.gmail.com" /></div>
        <div className="col-4"><input className="form-control" value={f.port} onChange={set("port")} placeholder="465" /></div>
        <div className="col-6"><input className="form-control" value={f.user} onChange={set("user")} placeholder="user@gmail.com" /></div>
        <div className="col-6"><input className="form-control" type="password" value={f.pass} onChange={set("pass")} placeholder="••••••••" /></div>
        <div className="col-6"><input className="form-control" value={f.to} onChange={set("to")} placeholder={t("tools.to")} /></div>
        <div className="col-6"><input className="form-control" value={f.subject} onChange={set("subject")} placeholder={t("tools.subject")} /></div>
        <div className="col-12"><textarea className="form-control" rows={3} value={f.body} onChange={set("body")} placeholder={t("tools.message")} /></div>
      </div>
      <p className="small text-muted mt-2 mb-0">{t("tools.emailHint")}</p>
      <button className="btn btn-primary mt-3 d-inline-flex align-items-center gap-2" disabled={busy || !f.host || !f.to} onClick={send}>
        {busy && <Loader2 size={16} className="mrd-spin" />}
        {t("common.send")}
      </button>
    </Card>
  );
}
