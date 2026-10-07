"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";

/** Minimal click-outside dropdown (no Bootstrap JS / jQuery needed). */
export function Dropdown({
  trigger,
  children,
  align = "end",
  menuClass = "",
}: {
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "start" | "end";
  menuClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="dropdown d-inline-block" ref={ref}>
      <div onClick={() => setOpen((o) => !o)} role="button">
        {trigger(open)}
      </div>
      {open && (
        <div
          className={`dropdown-menu show ${align === "end" ? "dropdown-menu-end" : ""} ${menuClass}`}
          style={{ position: "absolute", [align === "end" ? "right" : "left"]: 0 }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`mrd-spin ${className}`} />;
}

export function Loading({ label }: { label?: string }) {
  const { t } = useApp();
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-muted py-5">
      <Spinner size={30} className="text-primary" />
      <span className="mt-3 small">{label ?? t("common.loading")}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center text-muted py-5">
      {icon && <div className="mb-2 opacity-50">{icon}</div>}
      <p className="fw-semibold mb-1">{title}</p>
      {hint && <p className="small text-muted mb-0" style={{ maxWidth: 320 }}>{hint}</p>}
    </div>
  );
}

/** Fixed-position toast stack, driven by the AppProvider queue. */
export function ToastContainer() {
  const { toasts, dismiss } = useApp();
  return (
    <div className="mrd-toast-stack">
      {toasts.map((tst) => {
        const Icon =
          tst.kind === "success" ? CheckCircle2 : tst.kind === "error" ? AlertCircle : Info;
        return (
          <div key={tst.id} className={`mrd-toast mrd-toast-${tst.kind} mrd-fade`} role="alert">
            <Icon size={18} className="flex-shrink-0" />
            <span className="flex-grow-1 small">{tst.message}</span>
            <button className="mrd-toast-close" onClick={() => dismiss(tst.id)} aria-label="close">
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Centered modal dialog with backdrop; closes on Escape and backdrop click. */
export function Modal({
  title,
  onClose,
  children,
  footer,
  size = "md",
}: {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const max = size === "lg" ? 720 : size === "sm" ? 380 : 500;

  return (
    <div className="mrd-modal-backdrop" onClick={onClose}>
      <div
        className="mrd-modal-card mrd-fade card"
        style={{ maxWidth: max }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="mb-0 fw-bold fs-6">{title}</h5>
          <button className="btn btn-sm btn-link text-muted p-0" onClick={onClose} aria-label="close">
            <X size={20} />
          </button>
        </div>
        <div className="card-body">{children}</div>
        {footer && <div className="card-footer d-flex justify-content-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
