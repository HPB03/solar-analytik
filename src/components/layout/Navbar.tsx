import Link from "next/link";
import { Sun } from "lucide-react";

const navLinks = [
  { href: "/guide", label: "Guide" },
  { href: "/calculator", label: "Calculator" },
  { href: "/about", label: "Über uns" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-solar-border bg-solar-bg/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Sun className="w-6 h-6 text-solar-sun group-hover:text-solar-accent transition-colors" />
          <span className="font-bold text-solar-text text-lg tracking-tight">
            Solar<span className="text-solar-accent">Analytik</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-solar-text-secondary hover:text-solar-text text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <Link
          href="/calculator"
          className="px-4 py-2 rounded-md text-sm font-medium bg-solar-accent hover:bg-[#FF8A65] text-white transition-colors"
        >
          Kostenlos starten
        </Link>
      </div>
    </header>
  );
}
