"use client";

import { useState } from "react";
import { Volume2, Camera, Mic, Video, Image as ImageIcon, Mail, Loader2 } from "lucide-react";
import { phoneGet, phonePost, phoneAsset, okOf } from "@/lib/api";
import { Toast } from "@/components/ui";

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
        <span className="text-[var(--accent)]">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";
const btnCls =
  "inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:opacity-50";
const btnGhost =
  "inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 disabled:opacity-50";

export default function ToolsPanel() {
  return (
    <div className="grid gap-5 p-6 md:grid-cols-2">
      <TtsCard />
      <CameraCard />
      <VideoCard />
      <MicCard />
      <WallpaperCard />
      <div className="md:col-span-2">
        <EmailCard />
      </div>
    </div>
  );
}

function TtsCard() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function speak() {
    setBusy(true);
    setMsg(null);
    const r = okOf(await phonePost("/datas/tts/speak.xhtml", { text }));
    setMsg({ ok: r.success, t: r.success ? "Lecture en cours sur le téléphone." : `Erreur : ${r.error}` });
    setBusy(false);
  }
  return (
    <Card icon={<Volume2 size={18} />} title="Synthèse vocale">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Texte à faire lire par le téléphone…"
        className={`${inputCls} min-h-[70px] resize-y`}
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={speak} disabled={busy || !text.trim()} className={btnCls}>
          {busy && <Loader2 size={16} className="mrd-spin" />}
          Lire sur le téléphone
        </button>
      </div>
      {msg && (
        <div className="mt-3">
          <Toast ok={msg.ok}>{msg.t}</Toast>
        </div>
      )}
    </Card>
  );
}

function CameraCard() {
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function take(front: boolean) {
    setBusy(true);
    setMsg(null);
    setPhoto(null);
    const r = okOf(await phoneGet(`/datas/camera/take.xhtml?front=${front ? "1" : "0"}`));
    if (r.success && r.file) {
      setPhoto(phoneAsset("/" + r.file) + "?t=" + Date.now());
      setMsg({ ok: true, t: "Photo capturée." });
    } else {
      setMsg({ ok: false, t: `Erreur : ${r.error}` });
    }
    setBusy(false);
  }
  return (
    <Card icon={<Camera size={18} />} title="Caméra">
      <div className="flex gap-3">
        <button onClick={() => take(false)} disabled={busy} className={btnCls}>
          {busy && <Loader2 size={16} className="mrd-spin" />}
          Photo (arrière)
        </button>
        <button onClick={() => take(true)} disabled={busy} className={btnGhost}>
          Photo (avant)
        </button>
      </div>
      {msg && (
        <div className="mt-3">
          <Toast ok={msg.ok}>{msg.t}</Toast>
        </div>
      )}
      {photo && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={photo} alt="Photo" className="mt-3 w-full rounded-lg border border-slate-200" />
      )}
    </Card>
  );
}

function VideoCard() {
  const [recording, setRecording] = useState(false);
  const [front, setFront] = useState(false);
  const [video, setVideo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function start() {
    setBusy(true);
    setMsg(null);
    setVideo(null);
    const r = okOf(await phoneGet(`/datas/video/start.xhtml?front=${front ? "1" : "0"}`));
    setBusy(false);
    if (r.success) {
      setRecording(true);
      setMsg({ ok: true, t: "Enregistrement vidéo en cours…" });
    } else setMsg({ ok: false, t: `Erreur : ${r.error}` });
  }
  async function stop() {
    setBusy(true);
    const r = okOf(await phoneGet("/datas/video/stop.xhtml"));
    setBusy(false);
    setRecording(false);
    if (r.success && r.file) {
      setVideo(phoneAsset("/" + r.file) + "?t=" + Date.now());
      setMsg({ ok: true, t: "Vidéo enregistrée." });
    } else setMsg({ ok: false, t: `Erreur : ${r.error}` });
  }
  return (
    <Card icon={<Video size={18} />} title="Enregistrement vidéo">
      <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={front}
          disabled={recording}
          onChange={(e) => setFront(e.target.checked)}
        />
        Caméra avant
      </label>
      <div className="flex items-center gap-3">
        <button onClick={start} disabled={recording || busy} className={btnCls}>
          {recording && <span className="h-2 w-2 animate-pulse rounded-full bg-white" />}
          {recording ? "Enregistrement…" : "Démarrer"}
        </button>
        <button onClick={stop} disabled={!recording || busy} className={btnGhost}>
          Arrêter
        </button>
      </div>
      {msg && (
        <div className="mt-3">
          <Toast ok={msg.ok}>{msg.t}</Toast>
        </div>
      )}
      {video && (
        <video controls src={video} className="mt-3 w-full rounded-lg border border-slate-200">
          <track kind="captions" />
        </video>
      )}
    </Card>
  );
}

function MicCard() {
  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function start() {
    setMsg(null);
    setAudio(null);
    const r = okOf(await phoneGet("/datas/mic/start.xhtml"));
    if (r.success) {
      setRecording(true);
      setMsg({ ok: true, t: "Enregistrement en cours…" });
    } else setMsg({ ok: false, t: `Erreur : ${r.error}` });
  }
  async function stop() {
    const r = okOf(await phoneGet("/datas/mic/stop.xhtml"));
    setRecording(false);
    if (r.success && r.file) {
      setAudio(phoneAsset("/" + r.file) + "?t=" + Date.now());
      setMsg({ ok: true, t: "Enregistrement terminé." });
    } else setMsg({ ok: false, t: `Erreur : ${r.error}` });
  }
  return (
    <Card icon={<Mic size={18} />} title="Microphone">
      <div className="flex items-center gap-3">
        <button onClick={start} disabled={recording} className={btnCls}>
          {recording && <span className="h-2 w-2 animate-pulse rounded-full bg-white" />}
          {recording ? "Enregistrement…" : "Démarrer"}
        </button>
        <button onClick={stop} disabled={!recording} className={btnGhost}>
          Arrêter
        </button>
      </div>
      {msg && (
        <div className="mt-3">
          <Toast ok={msg.ok}>{msg.t}</Toast>
        </div>
      )}
      {audio && (
        <audio controls src={audio} className="mt-3 w-full">
          <track kind="captions" />
        </audio>
      )}
    </Card>
  );
}

function WallpaperCard() {
  const [path, setPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  async function apply() {
    setBusy(true);
    setMsg(null);
    const r = okOf(await phonePost("/datas/wallpaper/set.xhtml", { path }));
    setMsg({ ok: r.success, t: r.success ? "Fond d'écran appliqué." : `Erreur : ${r.error}` });
    setBusy(false);
  }
  return (
    <Card icon={<ImageIcon size={18} />} title="Fond d'écran">
      <input
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="/sdcard/Pictures/photo.jpg"
        className={inputCls}
      />
      <p className="mt-1 text-xs text-slate-400">
        Chemin d&apos;une image présente sur le téléphone (voir l&apos;onglet Fichiers).
      </p>
      <div className="mt-3">
        <button onClick={apply} disabled={busy || !path.trim()} className={btnCls}>
          {busy && <Loader2 size={16} className="mrd-spin" />}
          Appliquer
        </button>
      </div>
      {msg && (
        <div className="mt-3">
          <Toast ok={msg.ok}>{msg.t}</Toast>
        </div>
      )}
    </Card>
  );
}

function EmailCard() {
  const [f, setF] = useState({ host: "", port: "465", user: "", pass: "", to: "", subject: "", body: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });
  async function send() {
    setBusy(true);
    setMsg(null);
    const r = okOf(await phonePost("/datas/email/send.xhtml", f));
    setMsg({ ok: r.success, t: r.success ? "E-mail envoyé." : `Erreur : ${r.error}` });
    setBusy(false);
  }
  return (
    <Card icon={<Mail size={18} />} title="Envoi d'e-mail">
      <div className="grid gap-3 md:grid-cols-2">
        <input value={f.host} onChange={set("host")} placeholder="Serveur SMTP (smtp.gmail.com)" className={inputCls} />
        <input value={f.port} onChange={set("port")} placeholder="Port SSL (465)" className={inputCls} />
        <input value={f.user} onChange={set("user")} placeholder="Votre adresse (identifiant SMTP)" className={inputCls} />
        <input value={f.pass} onChange={set("pass")} type="password" placeholder="Mot de passe d'application" className={inputCls} />
        <input value={f.to} onChange={set("to")} placeholder="Destinataire" className={inputCls} />
        <input value={f.subject} onChange={set("subject")} placeholder="Objet" className={inputCls} />
      </div>
      <textarea value={f.body} onChange={set("body")} placeholder="Message…" className={`${inputCls} mt-3 min-h-[80px] resize-y`} />
      <p className="mt-1 text-xs text-slate-400">SMTP sécurisé (SSL, port 465). Pour Gmail, utilisez un « mot de passe d&apos;application ».</p>
      <div className="mt-3">
        <button onClick={send} disabled={busy || !f.host || !f.to} className={btnCls}>
          {busy && <Loader2 size={16} className="mrd-spin" />}
          Envoyer
        </button>
      </div>
      {msg && (
        <div className="mt-3">
          <Toast ok={msg.ok}>{msg.t}</Toast>
        </div>
      )}
    </Card>
  );
}
