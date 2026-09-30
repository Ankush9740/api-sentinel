import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "API Sentinel",
    template: "%s · API Sentinel",
  },
  description:
    "A focused workspace for testing, validating, and understanding HTTP APIs.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f8f3e9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
