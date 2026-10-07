"use client";

import { useApp } from "@/components/providers/AppProvider";

export default function Footer() {
  const { t, config } = useApp();
  const connected = config?.connected ?? false;
  return (
    <div className="app-wrapper-footer">
      <div className="app-footer">
        <div className="app-footer__inner">
          <div className="app-footer-left">
            <ul className="nav">
              <li className="nav-item">
                <span className="nav-link text-muted">
                  © {new Date().getFullYear()} {t("app.name")}
                </span>
              </li>
            </ul>
          </div>
          <div className="app-footer-right">
            <ul className="nav align-items-center">
              <li className="nav-item">
                <span className={`badge ${connected ? "bg-success" : "bg-danger"} me-2`}>
                  {connected ? t("header.connected") : t("header.disconnected")}
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link text-muted">v2.0 · PFE</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
