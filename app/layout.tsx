import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unramble",
  description: "Ramble all week, submit on Friday. Speak messy notes about your internship or lab work; get the report in your department's exact format.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
