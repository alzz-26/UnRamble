"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Quick report" },
  { href: "/projects", label: "My projects" },
  { href: "/demo", label: "Demo" },
];

export default function AppHeader({ subtitle, right }: { subtitle?: string; right?: React.ReactNode }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden>
          ¶
        </span>
        <div>
          <h1>Unramble</h1>
          <p className="muted">{subtitle ?? "Say what you did. Get the report in your department's format."}</p>
        </div>
      </Link>
      <nav className="topbar-right" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`nav-link${active(l.href) ? " nav-active" : ""}`}>
            {l.label}
          </Link>
        ))}
        {right}
      </nav>
    </header>
  );
}
