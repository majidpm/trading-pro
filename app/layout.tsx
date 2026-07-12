import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Trading Pro",
  description: "Professional Trading Journal",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <style>{`
          *:focus, *:focus-visible, *:active {
            outline: none !important;
            box-shadow: none !important;
          }
        `}</style>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}