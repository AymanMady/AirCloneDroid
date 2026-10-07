"use client";

import { useState } from "react";
import { Settings2, Moon, Sun } from "lucide-react";
import { useApp, type ThemeOptions } from "@/components/providers/AppProvider";

const HEADER_SCHEMES = [
  { label: "Blanc", value: "" },
  { label: "Primary", value: "bg-primary header-text-light" },
  { label: "Bliss", value: "bg-strong-bliss header-text-light" },
  { label: "Love Kiss", value: "bg-love-kiss header-text-light" },
  { label: "Night Sky", value: "bg-night-sky header-text-light" },
  { label: "Premium", value: "bg-premium-dark header-text-light" },
];

const SIDEBAR_SCHEMES = [
  { label: "Clair", value: "" },
  { label: "Royal", value: "bg-royal sidebar-text-light" },
  { label: "Midnight", value: "bg-midnight-bloom sidebar-text-light" },
  { label: "Asteroid", value: "bg-asteroid sidebar-text-light" },
  { label: "Slick", value: "bg-slick-carbon sidebar-text-light" },
  { label: "Premium", value: "bg-premium-dark sidebar-text-light" },
];

function Swatch({
  scheme,
  active,
  onClick,
}: {
  scheme: { label: string; value: string };
  active: boolean;
  onClick: () => void;
}) {
  const bg = scheme.value.split(" ")[0] || "bg-white";
  return (
    <button
      type="button"
      title={scheme.label}
      onClick={onClick}
      className={`${bg} border rounded`}
      style={{
        width: 34,
        height: 34,
        outline: active ? "3px solid #3f6ad8" : "none",
        outlineOffset: 1,
      }}
    />
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="form-check form-switch d-flex align-items-center justify-content-between py-1 ps-0">
      <label className="form-check-label order-1 small" htmlFor={`sw-${id}`}>
        {label}
      </label>
      <input
        className="form-check-input order-2 ms-0"
        type="checkbox"
        id={`sw-${id}`}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}

export default function ThemeDrawer() {
  const { theme, setTheme, t } = useApp();
  const [open, setOpen] = useState(false);

  const toggle = (k: keyof ThemeOptions, label: string) => (
    <Toggle
      id={k}
      label={label}
      checked={Boolean(theme[k])}
      onChange={(v) => setTheme({ [k]: v } as Partial<ThemeOptions>)}
    />
  );

  return (
    <div className={`ui-theme-settings ${open ? "settings-open" : ""}`}>
      <button
        type="button"
        className="btn-open-options btn btn-primary"
        onClick={() => setOpen((o) => !o)}
        aria-label="theme options"
      >
        <Settings2 size={22} className={open ? "mrd-spin" : ""} />
      </button>
      <div className="theme-settings__inner">
        <div className="p-3" style={{ overflowY: "auto", height: "100%" }}>
          <h3 className="themeoptions-heading d-flex align-items-center justify-content-between">
            {t("header.theme")}
          </h3>

          <div className="p-2">
            <div
              className="d-flex align-items-center justify-content-between rounded p-2 mb-3"
              style={{ background: theme.dark ? "#222838" : "#f1f4fb" }}
            >
              <span className="small fw-semibold d-flex align-items-center gap-2">
                {theme.dark ? <Moon size={16} /> : <Sun size={16} />}
                {theme.dark ? "Mode sombre" : "Mode clair"}
              </span>
              <div className="form-check form-switch m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={theme.dark}
                  onChange={(e) => setTheme({ dark: e.target.checked })}
                />
              </div>
            </div>

            {toggle("fixedHeader", "En-tête fixe")}
            {toggle("fixedSidebar", "Menu latéral fixe")}
            {toggle("fixedFooter", "Pied de page fixe")}
            {toggle("closedSidebar", "Menu réduit")}
          </div>

          <h3 className="themeoptions-heading mt-2">En-tête — couleur</h3>
          <div className="p-2 d-flex flex-wrap gap-2">
            {HEADER_SCHEMES.map((s) => (
              <Swatch
                key={s.value}
                scheme={s}
                active={theme.headerScheme === s.value}
                onClick={() => setTheme({ headerScheme: s.value })}
              />
            ))}
          </div>

          <h3 className="themeoptions-heading mt-2">Menu latéral — couleur</h3>
          <div className="p-2 d-flex flex-wrap gap-2">
            {SIDEBAR_SCHEMES.map((s) => (
              <Swatch
                key={s.value}
                scheme={s}
                active={theme.sidebarScheme === s.value}
                onClick={() => setTheme({ sidebarScheme: s.value })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
