"use client";

import { Smartphone } from "lucide-react";
import { useApp } from "@/components/providers/AppProvider";

/**
 * The ArchitectUI logo + hamburger cluster. Rendered in both the header (shown
 * on desktop) and the sidebar (shown on mobile), exactly as the template does;
 * CSS reveals the right one per breakpoint. The elastic hamburger collapses the
 * sidebar on desktop; the second toggles the mobile sidebar; the third reveals
 * the header menu on mobile.
 */
export default function LogoBlock() {
  const { theme, setTheme, mobileNavOpen, setMobileNavOpen } = useApp();

  return (
    <>
      <div className="app-header__logo">
        <div className="d-flex align-items-center gap-2 text-primary">
          <Smartphone size={26} strokeWidth={2.2} />
          <span className="fw-bold fs-5 text-dark">MyRemoteDroid</span>
        </div>
        <div className="header__pane ms-auto">
          <button
            type="button"
            className={`hamburger close-sidebar-btn hamburger--elastic ${theme.closedSidebar ? "is-active" : ""}`}
            onClick={() => setTheme({ closedSidebar: !theme.closedSidebar })}
            aria-label="collapse sidebar"
          >
            <span className="hamburger-box">
              <span className="hamburger-inner" />
            </span>
          </button>
        </div>
      </div>
      <div className="app-header__mobile-menu">
        <button
          type="button"
          className={`hamburger hamburger--elastic mobile-toggle-nav ${mobileNavOpen ? "is-active" : ""}`}
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="toggle navigation"
        >
          <span className="hamburger-box">
            <span className="hamburger-inner" />
          </span>
        </button>
      </div>
    </>
  );
}
