import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Report Builder",
  description: "Speak messy notes about your internship or lab work; get a report in your department's exact format.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
