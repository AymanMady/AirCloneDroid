"use client";

import { useState } from "react";
import { Settings, Circle, Check } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import { LANGS } from "@/lib/i18n";
import LogoBlock from "@/components/layout/LogoBlock";
import { Dropdown } from "@/components/ui";

export default function Header() {
  const { t, lang, setLang, config, setSettingsOpen, theme } = useApp();
  const [headerMobileOpen, setHeaderMobileOpen] = useState(false);
  const connected = config?.connected ?? false;
  const current = LANGS.find((l) => l.id === lang) ?? LANGS[0];

  return (
    <div className={`app-header header-shadow ${theme.headerScheme}`}>
      <LogoBlock />
      <div className="app-header__menu">
        <span>
          <button
            type="button"
            className="btn-icon btn-icon-only btn btn-primary btn-sm mobile-toggle-header-nav"
            onClick={() => setHeaderMobileOpen((v) => !v)}
          >
            <span className="btn-icon-wrapper">
              <i className="fa fa-ellipsis-v" />
            </span>
          </button>
        </span>
      </div>

      <div className={`app-header__content ${headerMobileOpen ? "header-mobile-open" : ""}`}>
        <div className="app-header-left">
          <div className="search-wrapper">
            <div className="input-holder">
              <input type="text" className="search-input" placeholder={t("header.search")} />
              <button className="search-icon">
                <span />
              </button>
            </div>
            <button className="btn-close" />
          </div>
        </div>

        <div className="app-header-right">
          {/* Demo badge */}
          {config?.demo && (
            <span className="badge bg-warning text-dark rounded-pill me-2" title="Données d'exemple">
              DÉMO
            </span>
          )}

          {/* Connection status pill */}
          <button
            className="btn btn-sm border rounded-pill d-inline-flex align-items-center gap-2 me-2"
            onClick={() => setSettingsOpen(true)}
            title={t("nav.settings")}
          >
            <Circle
              size={9}
              className={connected ? "text-success" : "text-danger"}
              fill="currentColor"
            />
            <span className="small">
              {config?.demo
                ? "Démonstration"
                : config?.host
                  ? `${config.host}:${config.port}`
                  : t("header.notConfigured")}
            </span>
          </button>

          {/* Language switcher */}
          <Dropdown
            trigger={() => (
              <button className="btn btn-sm btn-link text-decoration-none p-1 me-1">
                <span style={{ fontSize: 18 }}>{current.flag}</span>
                <span className="ms-1 small text-muted d-none d-md-inline">{current.id.toUpperCase()}</span>
              </button>
            )}
          >
            {(close) => (
              <>
                <h6 className="dropdown-header">{t("header.language")}</h6>
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    className="dropdown-item d-flex align-items-center gap-2"
                    onClick={() => {
                      setLang(l.id);
                      close();
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{l.flag}</span>
                    <span className="flex-grow-1">{l.label}</span>
                    {l.id === lang && <Check size={15} className="text-success" />}
                  </button>
                ))}
              </>
            )}
          </Dropdown>

          {/* Settings */}
          <button
            className="btn btn-sm btn-link text-muted p-1 me-2"
            onClick={() => setSettingsOpen(true)}
            title={t("nav.settings")}
          >
            <Settings size={19} />
          </button>

          {/* User */}
          <div className="header-btn-lg pe-0">
            <div className="widget-content p-0">
              <div className="widget-content-wrapper">
                <div className="widget-content-left">
                  <div className="btn-group">
                    <span className="p-0 btn d-flex align-items-center">
                      <span
                        className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center fw-bold"
                        style={{ width: 40, height: 40 }}
                      >
                        A
                      </span>
                    </span>
                  </div>
                </div>
                <div className="widget-content-left ms-3 header-user-info d-none d-lg-block">
                  <div className="widget-heading fs-6">Administrateur</div>
                  <div className="widget-subheading">{t("app.name")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
