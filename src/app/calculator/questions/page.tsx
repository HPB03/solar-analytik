"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Home, Building2, Building, Zap, Car, Thermometer } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { UserQuestions, PanelTier } from "@/lib/types";

type BuildingType = UserQuestions["buildingType"];

const buildingTypes: { value: BuildingType; label: string; icon: React.ElementType }[] = [
  { value: "haus", label: "Einfamilienhaus", icon: Home },
  { value: "reihenhaus", label: "Reihenhaus", icon: Building2 },
  { value: "wohnung", label: "Wohnung / MFH", icon: Building },
];

const panelTiers: { value: PanelTier; label: string; desc: string; price: string }[] = [
  { value: "budget", label: "Budget", desc: "Gutes Preis-Leistungs-Verhältnis", price: "~€800/kWp" },
  { value: "mid", label: "Standard", desc: "Bewährte Qualität, gute Leistung", price: "~€1.100/kWp" },
  { value: "premium", label: "Premium", desc: "Höchste Effizienz, lange Garantie", price: "~€1.400/kWp" },
];

function QuestionsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lat = searchParams.get("lat") ?? "";
  const lng = searchParams.get("lng") ?? "";
  const address = searchParams.get("address") ?? "";

  const [building, setBuilding] = useState<BuildingType>("haus");
  const [monthlyBill, setMonthlyBill] = useState<number>(120);
  const [hasEV, setHasEV] = useState(false);
  const [hasHeatPump, setHasHeatPump] = useState(false);
  const [wantsBattery, setWantsBattery] = useState<UserQuestions["wantsBattery"]>("unsure");
  const [panelTier, setPanelTier] = useState<PanelTier>("mid");

  const handleSubmit = () => {
    const params = new URLSearchParams({
      lat,
      lng,
      address,
      building,
      monthlyBill: monthlyBill.toString(),
      hasEV: hasEV.toString(),
      hasHeatPump: hasHeatPump.toString(),
      wantsBattery,
      panelTier,
    });
    router.push(`/calculator/result?${params}`);
  };

  return (
    <div className="min-h-screen bg-solar-bg">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 pt-12 pb-32">
        {/* Progress */}
        <div className="w-full h-1 bg-solar-border rounded-full mb-12">
          <div className="h-1 bg-solar-accent rounded-full transition-all" style={{ width: "66%" }} />
        </div>

        <p className="text-solar-text-muted text-sm mb-1">Schritt 2 von 3</p>
        <h1 className="text-2xl font-bold text-solar-text mb-1">Ihr Gebäude</h1>
        {address && (
          <p className="text-solar-text-muted text-sm mb-8 truncate">📍 {address}</p>
        )}

        {/* Building type */}
        <div className="mb-8">
          <label className="text-solar-text-secondary text-sm mb-3 block">Gebäudetyp</label>
          <div className="grid grid-cols-3 gap-3">
            {buildingTypes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setBuilding(value)}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border transition-all
                  ${building === value
                    ? "border-solar-accent bg-solar-accent/10 text-solar-text"
                    : "border-solar-border bg-solar-card text-solar-text-secondary hover:border-solar-text-muted"
                  }
                `}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Monthly bill */}
        <div className="mb-8">
          <label className="text-solar-text-secondary text-sm mb-3 block">
            Monatliche Stromrechnung:{" "}
            <span className="text-solar-text font-semibold">€{monthlyBill}</span>
          </label>
          <input
            type="range"
            min={40}
            max={400}
            step={10}
            value={monthlyBill}
            onChange={(e) => setMonthlyBill(Number(e.target.value))}
            className="w-full accent-solar-accent"
          />
          <div className="flex justify-between text-solar-text-muted text-xs mt-1">
            <span>€40</span>
            <span>€400</span>
          </div>
        </div>

        {/* Extras */}
        <div className="mb-8 space-y-3">
          <label className="text-solar-text-secondary text-sm block">Zusätzliche Geräte</label>
          {[
            { value: hasEV, set: setHasEV, icon: Car, label: "Elektroauto (E-Auto)" },
            { value: hasHeatPump, set: setHasHeatPump, icon: Thermometer, label: "Wärmepumpe" },
          ].map(({ value, set, icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => set(!value)}
              className={`
                w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left
                ${value
                  ? "border-solar-accent bg-solar-accent/10 text-solar-text"
                  : "border-solar-border bg-solar-card text-solar-text-secondary hover:border-solar-text-muted"
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{label}</span>
              <div className={`ml-auto w-4 h-4 rounded border-2 flex items-center justify-center ${value ? "bg-solar-accent border-solar-accent" : "border-solar-border"}`}>
                {value && <span className="text-white text-xs">✓</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Battery */}
        <div className="mb-8">
          <label className="text-solar-text-secondary text-sm mb-3 block">
            <Zap className="inline w-4 h-4 mr-1" />
            Batteriespeicher gewünscht?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["yes", "no", "unsure"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setWantsBattery(v)}
                className={`
                  py-2.5 px-3 rounded-lg border text-sm transition-all
                  ${wantsBattery === v
                    ? "border-solar-accent bg-solar-accent/10 text-solar-text"
                    : "border-solar-border bg-solar-card text-solar-text-secondary hover:border-solar-text-muted"
                  }
                `}
              >
                {v === "yes" ? "Ja" : v === "no" ? "Nein" : "Unsicher"}
              </button>
            ))}
          </div>
        </div>

        {/* Panel tier */}
        <div className="mb-10">
          <label className="text-solar-text-secondary text-sm mb-3 block">Qualitätsstufe</label>
          <div className="space-y-2">
            {panelTiers.map(({ value, label, desc, price }) => (
              <button
                key={value}
                onClick={() => setPanelTier(value)}
                className={`
                  w-full flex items-center justify-between p-4 rounded-lg border transition-all text-left
                  ${panelTier === value
                    ? "border-solar-accent bg-solar-accent/10"
                    : "border-solar-border bg-solar-card hover:border-solar-text-muted"
                  }
                `}
              >
                <div>
                  <div className="text-solar-text font-medium text-sm">{label}</div>
                  <div className="text-solar-text-muted text-xs mt-0.5">{desc}</div>
                </div>
                <div className="text-solar-accent text-sm font-medium tabular-nums">{price}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-lg bg-solar-accent hover:bg-[#FF8A65] text-white font-semibold text-base transition-colors"
        >
          Analyse starten →
        </button>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-solar-bg" />}>
      <QuestionsForm />
    </Suspense>
  );
}
