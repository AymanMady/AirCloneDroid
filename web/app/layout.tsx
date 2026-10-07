import type { Metadata } from "next";
import "./globals.scss";
import { AppProvider } from "@/components/providers/AppProvider";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "MyRemoteDroid — Console",
  description: "Pilotez votre téléphone Android depuis votre navigateur",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" data-theme="light">
      <head>
        {/* Compiled ArchitectUI theme (Bootstrap 5 + layout + icon fonts). */}
        <link rel="stylesheet" href="/architectui/assets/styles/main.css" />
      </head>
      <body>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
