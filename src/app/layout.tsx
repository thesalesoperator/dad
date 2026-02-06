import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAD GYM",
  description: "Effortless progressive overload.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
