"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/providers/AppProvider";
import LogoBlock from "@/components/layout/LogoBlock";

type Item = { href: string; label: string; icon: string };
type Group = { heading: string; items: Item[] };

const GROUPS: Group[] = [
  {
    heading: "nav.device",
    items: [{ href: "/", label: "nav.dashboard", icon: "pe-7s-graph3" }],
  },
  {
    heading: "nav.main",
    items: [
      { href: "/sms", label: "nav.sms", icon: "pe-7s-mail" },
      { href: "/contacts", label: "nav.contacts", icon: "pe-7s-users" },
      { href: "/calls", label: "nav.calls", icon: "pe-7s-call" },
      { href: "/files", label: "nav.files", icon: "pe-7s-folder" },
      { href: "/apps", label: "nav.apps", icon: "pe-7s-display2" },
      { href: "/tools", label: "nav.tools", icon: "pe-7s-tools" },
    ],
  },
];

export default function Sidebar() {
  const { t, theme, setMobileNavOpen } = useApp();
  const pathname = usePathname();

  return (
    <div className={`app-sidebar sidebar-shadow ${theme.sidebarScheme}`}>
      <LogoBlock />
      <div className="scrollbar-sidebar">
        <div className="app-sidebar__inner">
          <ul className="vertical-nav-menu">
            {GROUPS.map((g) => (
              <Fragment key={g.heading}>
                <li className="app-sidebar__heading">{t(g.heading)}</li>
                {g.items.map((it) => {
                  const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={active ? "mm-active" : ""}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <i className={`metismenu-icon ${it.icon}`} />
                        {t(it.label)}
                      </Link>
                    </li>
                  );
                })}
              </Fragment>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
