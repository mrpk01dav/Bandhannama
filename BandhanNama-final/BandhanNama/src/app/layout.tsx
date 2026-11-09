import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BandhanNama — One bond. Countless memories. Infinite love.",
  description: "A heartfelt Bhai Dooj surprise for the sisters who make life brighter.",
  applicationName: "BandhanNama",
  robots: { index: false, follow: false },
  openGraph: {
    title: "BandhanNama — A bond beyond words",
    description: "A little Bhai Dooj surprise, created with love.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0812",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
