"use client";

import { Smartphone } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import ThemeDrawer from "@/components/layout/ThemeDrawer";
import SettingsModal from "@/components/SettingsModal";
import { ToastContainer } from "@/components/ui";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, config, settingsOpen, setSettingsOpen, mobileNavOpen } = useApp();

  const classes = [
    "app-container",
    theme.dark ? "app-theme-dark" : "app-theme-white",
    "body-tabs-shadow",
    theme.fixedHeader ? "fixed-header" : "",
    theme.fixedSidebar ? "fixed-sidebar" : "",
    theme.fixedFooter ? "fixed-footer" : "",
    theme.closedSidebar ? "closed-sidebar closed-sidebar-mobile" : "",
    mobileNavOpen ? "sidebar-mobile-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const connected = config?.connected ?? false;
  const configured = !!config?.host;

  return (
    <div className={classes}>
      <Header />
      <ThemeDrawer />
      <div className="app-main">
        <Sidebar />
        <div className="app-main__outer">
          <div className="app-main__inner">
            {connected ? (
              children
            ) : (
              <NotConnected onConfigure={() => setSettingsOpen(true)} configured={configured} error={config?.error} />
            )}
          </div>
          <Footer />
        </div>
      </div>

      {settingsOpen && <SettingsModal />}
      <ToastContainer />
    </div>
  );
}

function NotConnected({
  onConfigure,
  error,
}: {
  onConfigure: () => void;
  configured: boolean;
  error?: string;
}) {
  const { t } = useApp();
  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center mrd-fade" style={{ minHeight: "60vh" }}>
      <div className="mrd-stat-icon bg-primary" style={{ width: 72, height: 72 }}>
        <Smartphone size={34} />
      </div>
      <h4 className="mt-4 fw-bold">{t("conn.notConnectedTitle")}</h4>
      <p className="text-muted mt-1" style={{ maxWidth: 440 }}>
        {error ? `${t("common.error")} : ${error}` : t("conn.notConnectedHint")}
      </p>
      <button className="btn btn-primary btn-lg mt-3" onClick={onConfigure}>
        {t("conn.configure")}
      </button>
    </div>
  );
}
