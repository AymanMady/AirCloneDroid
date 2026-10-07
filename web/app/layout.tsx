import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyRemoteDroid",
  description: "Pilotez votre téléphone Android depuis votre navigateur",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
