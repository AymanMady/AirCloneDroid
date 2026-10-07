"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Folder,
  File as FileIcon,
  Image as ImageIcon,
  Download,
  RefreshCw,
  ChevronRight,
  Home,
  Upload,
  FolderPlus,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";
import { phoneGet, phonePost, phoneAsset, asArray } from "@/lib/api";
import { useApp } from "@/components/providers/AppProvider";
import PageTitle from "@/components/layout/PageTitle";
import { Loading, EmptyState, Modal } from "@/components/ui";

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
const IMG_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];

function humanSize(bytes: string | null): string {
  if (!bytes) return "";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "";
  if (n > 1e6) return (n / 1e6).toFixed(1) + " Mo";
  if (n > 1e3) return (n / 1e3).toFixed(0) + " Ko";
  return n + " o";
}

type ActionModal =
  | { type: "newfolder" }
  | { type: "rename"; entry: Entry }
  | { type: "delete"; entry: Entry }
  | { type: "preview"; entry: Entry }
  | null;

export default function FilesPanel() {
  const { t, notify } = useApp();
  const [dir, setDir] = useState(ROOT);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ActionModal>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (d: string) => {
    setEntries(null);
    setError(null);
    const res = await phoneGet("/datas/filemanagement/jqueryFileTree.xhtml?dir=" + encodeURIComponent(d));
    const arr = asArray<Entry>(res);
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
  const dirSlash = dir.endsWith("/") ? dir : dir + "/";

  function downloadUrl(e: Entry) {
    const qs = new URLSearchParams({ file: e.Path, name: e.Filename, mime: "application/octet-stream" }).toString();
    return phoneAsset("/datas/filemanagement/get_file.xhtml?" + qs);
  }
  function previewUrl(e: Entry) {
    const ext = (e.Extension || "").toLowerCase();
    const mime = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : "image/jpeg";
    const qs = new URLSearchParams({ file: e.Path, mime }).toString();
    return phoneAsset("/datas/filemanagement/get_file.xhtml?" + qs);
  }
  const isImage = (e: Entry) => e.Filetype === "file" && IMG_EXT.includes((e.Extension || "").toLowerCase());

  async function doUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("currentpath", dirSlash);
      fd.append("file", file, file.name);
      const res = await fetch("/api/phone/datas/filemanagement/filemanager.xhtml", {
        method: "POST",
        body: fd,
        cache: "no-store",
      });
      if (!res.ok) throw new Error();
      notify("success", t("files.uploaded"));
      load(dir);
    } catch {
      notify("error", t("common.error"));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <>
      <PageTitle
        icon="pe-7s-folder"
        iconBg="bg-happy-itmeo"
        title={t("nav.files")}
        actions={
          <>
            <input
              ref={fileInput}
              type="file"
              className="d-none"
              onChange={(e) => e.target.files?.[0] && doUpload(e.target.files[0])}
            />
            <button className="btn btn-light me-2 d-inline-flex align-items-center gap-2" onClick={() => setModal({ type: "newfolder" })}>
              <FolderPlus size={16} /> {t("files.newFolder")}
            </button>
            <button
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? <Loader2 size={16} className="mrd-spin" /> : <Upload size={16} />}
              {uploading ? t("files.uploading") : t("files.upload")}
            </button>
          </>
        }
      />

      <div className="card mb-3">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <nav className="d-flex align-items-center flex-wrap gap-1 small">
            <button className="btn btn-sm btn-light" onClick={() => setDir(ROOT)} title={t("files.root")}>
              <Home size={15} />
            </button>
            {segments.map((seg, i) => {
              const path = "/" + segments.slice(0, i + 1).join("/") + "/";
              return (
                <span key={i} className="d-flex align-items-center gap-1">
                  <ChevronRight size={13} className="text-muted" />
                  <button className="btn btn-sm btn-link text-decoration-none p-0 px-1" onClick={() => setDir(path)}>
                    {seg}
                  </button>
                </span>
              );
            })}
          </nav>
          <button className="btn btn-sm btn-light" onClick={() => load(dir)}>
            <RefreshCw size={15} />
          </button>
        </div>

        {entries === null ? (
          <Loading />
        ) : error ? (
          <EmptyState icon={<Folder size={28} />} title={error} />
        ) : entries.length === 0 ? (
          <EmptyState icon={<Folder size={28} />} title={t("files.empty")} />
        ) : (
          <div className="list-group list-group-flush">
            {entries.map((e, i) => (
              <div key={i} className="list-group-item d-flex align-items-center gap-3">
                {e.Filetype === "dir" ? (
                  <button className="btn btn-link text-decoration-none p-0 d-flex align-items-center gap-3 flex-grow-1 text-start" onClick={() => setDir(e.Path)}>
                    <Folder size={20} className="text-warning flex-shrink-0" />
                    <span className="fw-semibold text-body">{e.Filename}</span>
                  </button>
                ) : (
                  <>
                    {isImage(e) ? (
                      <ImageIcon size={20} className="text-info flex-shrink-0 mrd-clickable" onClick={() => setModal({ type: "preview", entry: e })} role="button" />
                    ) : (
                      <FileIcon size={20} className="text-muted flex-shrink-0" />
                    )}
                    <div className="flex-grow-1 min-w-0">
                      <div
                        className={`text-truncate ${isImage(e) ? "mrd-clickable text-body" : ""}`}
                        onClick={isImage(e) ? () => setModal({ type: "preview", entry: e }) : undefined}
                        role={isImage(e) ? "button" : undefined}
                      >
                        {e.Filename}
                      </div>
                      <div className="small text-muted">
                        {humanSize(e.Size)} · {e.Modified}
                      </div>
                    </div>
                  </>
                )}
                <div className="d-flex gap-1">
                  <button className="btn btn-sm btn-light" title={t("common.rename")} onClick={() => setModal({ type: "rename", entry: e })}>
                    <Pencil size={14} />
                  </button>
                  {e.Filetype === "file" && (
                    <a className="btn btn-sm btn-light" href={downloadUrl(e)} title={t("common.download")}>
                      <Download size={14} />
                    </a>
                  )}
                  <button className="btn btn-sm btn-outline-danger" title={t("common.delete")} onClick={() => setModal({ type: "delete", entry: e })}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal?.type === "newfolder" && (
        <NewFolder
          dir={dirSlash}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            notify("success", t("files.created"));
            load(dir);
          }}
        />
      )}
      {modal?.type === "rename" && (
        <Rename
          entry={modal.entry}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            notify("success", t("files.renamed"));
            load(dir);
          }}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDelete
          entry={modal.entry}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            notify("success", t("common.success"));
            load(dir);
          }}
        />
      )}
      {modal?.type === "preview" && (
        <Modal title={modal.entry.Filename} onClose={() => setModal(null)} size="lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl(modal.entry)} alt={modal.entry.Filename} className="w-100 rounded" />
        </Modal>
      )}
    </>
  );
}

function NewFolder({ dir, onClose, onDone }: { dir: string; onClose: () => void; onDone: () => void }) {
  const { t, notify } = useApp();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  async function create() {
    setBusy(true);
    const res = await phonePost("/datas/filemanagement/filemanager.xhtml", { mode: "addfolder", path: dir, name });
    setBusy(false);
    const o = res as { Code?: number } | null;
    if (o && o.Code === 0) onDone();
    else notify("error", t("common.error"));
  }
  return (
    <Modal
      title={t("files.newFolder")}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-light" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={busy || !name.trim()} onClick={create}>
            {busy && <Loader2 size={16} className="mrd-spin" />}
            {t("common.save")}
          </button>
        </>
      }
    >
      <input className="form-control" autoFocus placeholder={t("files.folderName")} value={name} onChange={(e) => setName(e.target.value)} />
    </Modal>
  );
}

function Rename({ entry, onClose, onDone }: { entry: Entry; onClose: () => void; onDone: () => void }) {
  const { t, notify } = useApp();
  const [name, setName] = useState(entry.Filename);
  const [busy, setBusy] = useState(false);
  async function rename() {
    setBusy(true);
    const res = await phonePost("/datas/filemanagement/filemanager.xhtml", { mode: "rename", old: entry.Path, new: name });
    setBusy(false);
    const o = res as { Code?: number } | null;
    if (o && o.Code === 0) onDone();
    else notify("error", t("common.error"));
  }
  return (
    <Modal
      title={t("common.rename")}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-light" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={busy || !name.trim()} onClick={rename}>
            {busy && <Loader2 size={16} className="mrd-spin" />}
            {t("common.save")}
          </button>
        </>
      }
    >
      <input className="form-control" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={t("files.renameTo")} />
    </Modal>
  );
}

function ConfirmDelete({ entry, onClose, onDone }: { entry: Entry; onClose: () => void; onDone: () => void }) {
  const { t, notify } = useApp();
  const [busy, setBusy] = useState(false);
  async function del() {
    setBusy(true);
    const res = await phonePost("/datas/filemanagement/filemanager.xhtml", { mode: "delete", path: entry.Path });
    setBusy(false);
    const o = res as { Code?: number } | null;
    if (o && o.Code === 0) onDone();
    else notify("error", t("common.error"));
  }
  return (
    <Modal
      title={t("common.delete")}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn btn-light" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn btn-danger d-inline-flex align-items-center gap-2" disabled={busy} onClick={del}>
            {busy && <Loader2 size={16} className="mrd-spin" />}
            {t("common.delete")}
          </button>
        </>
      }
    >
      <p className="mb-0">{t("files.confirmDelete", { name: entry.Filename })}</p>
    </Modal>
  );
}
