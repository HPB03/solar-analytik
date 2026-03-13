"use client";

import { useRouter } from "next/navigation";
import { Sun, Zap, TrendingUp, Shield } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { AddressInput } from "@/components/address-input/AddressInput";
import { GeocodeResult } from "@/lib/types";

const steps = [
  {
    num: "01",
    title: "Adresse eingeben",
    desc: "Geben Sie Ihre Adresse in Hannover ein. Wir analysieren automatisch Ihr Dach per Satellit.",
    link: "Jetzt starten →",
    href: "/calculator",
  },
  {
    num: "02",
    title: "KI analysiert Ihr Dach",
    desc: "Unser System berechnet Dachfläche, Neigung, Ausrichtung und Sonnenstunden — vollautomatisch.",
    link: "Wie es funktioniert →",
    href: "/guide",
  },
  {
    num: "03",
    title: "Ergebnis in 2 Minuten",
    desc: "Sie erhalten einen detaillierten Bericht mit Kosten, Ertrag, Amortisation und Förderungen.",
    link: "Beispiel-Bericht →",
    href: "/calculator/result/demo",
  },
];

const stats = [
  { icon: Sun, value: "1.700", unit: "Sonnenstunden/Jahr", label: "in Hannover" },
  { icon: Zap, value: "4.800", unit: "kWh/Jahr", label: "durchschn. Ertrag" },
  { icon: TrendingUp, value: "7–10", unit: "Jahre", label: "Amortisation" },
  { icon: Shield, value: "100%", unit: "kostenlos", label: "Keine Registrierung" },
];

export default function HomePage() {
  const router = useRouter();

  const handleAddressSelect = (result: GeocodeResult) => {
    const params = new URLSearchParams({
      lat: result.lat.toString(),
      lng: result.lng.toString(),
      address: result.formattedAddress,
    });
    router.push(`/calculator/questions?${params}`);
  };

  return (
    <div className="min-h-screen bg-solar-bg">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-solar-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-solar-card border border-solar-border text-solar-accent text-xs font-medium mb-8">
            <Sun className="w-3.5 h-3.5" />
            Kostenlose KI-Analyse für Hannover
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-solar-text leading-tight mb-6">
            Lohnt sich Solar für{" "}
            <span className="text-solar-accent">Ihr Dach</span>{" "}
            in Hannover?
          </h1>

          <p className="text-lg text-solar-text-secondary mb-10 max-w-xl mx-auto">
            Geben Sie Ihre Adresse ein — KI berechnet Kosten, Ertrag und
            Amortisation in 2 Minuten.
          </p>

          <div className="max-w-xl mx-auto">
            <AddressInput onSelect={handleAddressSelect} />
            <p className="mt-3 text-solar-text-muted text-sm">
              Kostenlos. Ohne Registrierung.
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-solar-border bg-solar-card/50">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ icon: Icon, value, unit, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-solar-accent/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-solar-accent" />
              </div>
              <div>
                <div className="font-bold text-solar-text tabular-nums">
                  {value}{" "}
                  <span className="text-solar-text-secondary font-normal text-sm">
                    {unit}
                  </span>
                </div>
                <div className="text-solar-text-muted text-xs">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <h2 className="text-2xl font-bold text-solar-text mb-12">
          Wie es funktioniert
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="group">
              <div className="text-5xl font-bold text-solar-border mb-4 tabular-nums">
                {step.num}
              </div>
              <h3 className="text-lg font-semibold text-solar-text mb-2">
                {step.title}
              </h3>
              <p className="text-solar-text-secondary text-sm leading-relaxed mb-4">
                {step.desc}
              </p>
              <a
                href={step.href}
                className="text-solar-accent hover:text-solar-accent-hover text-sm font-medium transition-colors"
              >
                {step.link}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-solar-border bg-solar-card/30">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-solar-text mb-4">
            Bereit für Ihre persönliche Analyse?
          </h2>
          <p className="text-solar-text-secondary mb-8">
            Über 500 Häuser in Hannover wurden bereits analysiert.
          </p>
          <AddressInput
            onSelect={handleAddressSelect}
            className="max-w-xl mx-auto"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-solar-footer border-t border-solar-border">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-solar-sun" />
              <span className="font-bold text-solar-text">SolarAnalytik</span>
            </div>
            <p className="text-solar-text-muted text-sm">
              KI-gestützte Solaranalyse für die Region Hannover.
            </p>
          </div>
          {[
            { title: "Produkt", links: ["Calculator", "Guide", "Preise", "API"] },
            { title: "Unternehmen", links: ["Über uns", "Blog", "Karriere"] },
            { title: "Rechtliches", links: ["Datenschutz", "Impressum", "AGB"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-solar-text font-medium text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-solar-text-muted hover:text-solar-text text-sm transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-solar-border">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-solar-text-muted text-sm">
            © 2026 AI Solar Analytik — Hannover, Deutschland
          </div>
        </div>
      </footer>
    </div>
  );
}
