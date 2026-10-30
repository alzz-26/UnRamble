"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const LINKS = [
  { href: "/quick", label: "Quick report" },
  { href: "/demo", label: "Demo" },
];

export default function AppHeader({ subtitle, right }: { subtitle?: string; right?: React.ReactNode }) {
  const path = usePathname();
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="Unramble home">
        <Logo />
        <span className="brand-text">
          <span className="brand-name">unramble</span>
          {subtitle && <span className="brand-sub">{subtitle}</span>}
        </span>
      </Link>
      <nav className="topbar-right" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`nav-link${path.startsWith(l.href) ? " nav-active" : ""}`}>
            {l.label}
          </Link>
        ))}
        <Link href="/projects" className={`nav-cta${path.startsWith("/projects") ? " nav-cta-on" : ""}`}>
          My projects
        </Link>
        {right}
      </nav>
    </header>
  );
}
