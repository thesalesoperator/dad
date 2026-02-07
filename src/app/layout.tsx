import type { Metadata, Viewport } from "next";
import "./globals.css";
import NativeInit from "@/components/native/NativeInit";

export const metadata: Metadata = {
  title: "DAD GYM",
  description: "Effortless progressive overload.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NativeInit />
        {children}
      </body>
    </html>
  );
}
