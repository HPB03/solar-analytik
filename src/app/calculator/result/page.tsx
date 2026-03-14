"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sun, Zap, TrendingUp, Home, CheckCircle, AlertCircle,
  XCircle, Loader2, Battery, Car
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { SolarIrradiance, RoofAnalysis, PanelTier } from "@/lib/types";
import { HANNOVER_OPTIMAL_TILT, TYPICAL_BATTERY_KWH } from "@/lib/constants";
import { calculateEnergy } from "@/modules/M4-energy-calc";
import { calculateFinancials } from "@/modules/M5-financial-calc";
import { RoofViewer } from "@/components/roof-viewer/RoofViewer";
import panelsData from "../../../../data/panels.json";

const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function ResultContent() {
  const sp = useSearchParams();

  const lat = parseFloat(sp.get("lat") ?? "52.37");
  const lng = parseFloat(sp.get("lng") ?? "9.73");
  const address = sp.get("address") ?? "";
  const monthlyBill = parseFloat(sp.get("monthlyBill") ?? "120");
  const hasEV = sp.get("hasEV") === "true";
  const wantsBattery = sp.get("wantsBattery") ?? "unsure";
  const panelTier = (sp.get("panelTier") ?? "mid") as PanelTier;

  const [solar, setSolar] = useState<SolarIrradiance | null>(null);
  const [roof, setRoof] = useState<RoofAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<"no_battery" | "with_battery">(
    wantsBattery === "yes" ? "with_battery" : "no_battery"
  );

  useEffect(() => {
    async function loadData() {
      try {
        // Step 1: roof analysis (determines real tilt + azimuth)
        const roofRes = await fetch(`/api/roof-analysis?lat=${lat}&lng=${lng}`);
        const roofData: RoofAnalysis = await roofRes.json();
        setRoof(roofData);

        // Step 2: solar irradiance using actual roof orientation
        const solarRes = await fetch(
          `/api/solar-data?lat=${lat}&lng=${lng}&tilt=${roofData.tilt}&azimuth=${roofData.azimuth}`
        );
        setSolar(await solarRes.json());
      } catch {
        // Fallback: use Hannover defaults
        try {
          const solarRes = await fetch(
            `/api/solar-data?lat=${lat}&lng=${lng}&tilt=${HANNOVER_OPTIMAL_TILT}&azimuth=0`
          );
          setSolar(await solarRes.json());
        } catch {
          // leave solar null
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="min-h-screen bg-solar-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-solar-accent animate-spin mx-auto mb-4" />
          <p className="text-solar-text-secondary">Analysiere Ihr Dach...</p>
        </div>
      </div>
    );
  }

  if (!solar) return null;

  const roofAreaM2 = roof?.roofArea ?? 30;
  const withBattery = activeScenario === "with_battery";

  const energy = calculateEnergy({
    solar, monthlyBill, panelTier, roofAreaM2, hasEV, withBattery,
    shadingFactor: roof?.shadingFactor ?? 0,
  });
  const financial = calculateFinancials({ energy, withBattery, panelTier, roofAreaM2 });

  const res = { ...energy, ...financial };

  const verdictConfig = {
    profitable: {
      icon: CheckCircle,
      color: "text-solar-success",
      bg: "bg-solar-success/10 border-solar-success/30",
      label: "Lohnt sich!",
    },
    marginal: {
      icon: AlertCircle,
      color: "text-solar-warning",
      bg: "bg-solar-warning/10 border-solar-warning/30",
      label: "Grenzwertig",
    },
    not_profitable: {
      icon: XCircle,
      color: "text-solar-danger",
      bg: "bg-solar-danger/10 border-solar-danger/30",
      label: "Nicht empfohlen",
    },
  }[res.verdict];

  const VerdictIcon = verdictConfig.icon;
  const maxBarHeight = Math.max(...res.monthlyProduction);

  return (
    <div className="min-h-screen bg-solar-bg">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-8 pb-24">
        {/* Progress */}
        <div className="w-full h-1 bg-solar-border rounded-full mb-8">
          <div className="h-1 bg-solar-accent rounded-full w-full" />
        </div>

        {address && (
          <p className="text-solar-text-muted text-sm mb-6">📍 {address}</p>
        )}

        {/* Scenario tabs */}
        <div className="flex gap-1 p-1 bg-solar-card rounded-lg border border-solar-border mb-8 w-fit">
          {[
            { value: "no_battery" as const, label: "Ohne Batterie" },
            { value: "with_battery" as const, label: "Mit Batterie", icon: Battery },
            ...(hasEV ? [{ value: "with_battery" as const, label: "Mit E-Auto", icon: Car }] : []),
          ].slice(0, 2).map(({ value, label, icon: Icon }) => (
            <button
              key={value + label}
              onClick={() => setActiveScenario(value)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all
                ${activeScenario === value
                  ? "bg-solar-accent text-white"
                  : "text-solar-text-secondary hover:text-solar-text"
                }
              `}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>

        {/* Verdict card */}
        <div className={`rounded-xl border p-6 mb-6 ${verdictConfig.bg}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <VerdictIcon className={`w-8 h-8 ${verdictConfig.color}`} />
              <div>
                <div className={`text-xl font-bold ${verdictConfig.color}`}>
                  {verdictConfig.label}
                </div>
                <div className="text-solar-text-secondary text-sm mt-0.5">
                  Amortisation in {res.paybackYears} Jahren · {res.score}/10 Punkte
                </div>
              </div>
            </div>
            <div className={`text-5xl font-bold tabular-nums ${verdictConfig.color}`}>
              {res.score}<span className="text-2xl text-solar-text-muted">/10</span>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Money card */}
          <div className="bg-solar-card border border-solar-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-solar-accent" />
              <h3 className="font-semibold text-solar-text">Kosten & Ersparnis</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Installationskosten</span>
                <span className="text-solar-text font-semibold tabular-nums">
                  €{res.installationCostRange.min.toLocaleString("de")} – €{res.installationCostRange.max.toLocaleString("de")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Förderungen</span>
                <span className="text-solar-success font-semibold tabular-nums">
                  −€{res.totalSubsidies.toLocaleString("de")}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-solar-border pt-3">
                <span className="text-solar-text-secondary text-sm">Nettokosten (ca.)</span>
                <span className="text-solar-text font-bold tabular-nums text-lg">
                  €{res.netCost.toLocaleString("de")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Ersparnis/Jahr</span>
                <span className="text-solar-accent font-bold tabular-nums">
                  €{res.annualSavings.toLocaleString("de")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Gewinn über 25 Jahre</span>
                <span className={`font-bold tabular-nums ${res.roi25Years > 0 ? "text-solar-success" : "text-solar-danger"}`}>
                  {res.roi25Years > 0 ? "+" : ""}€{res.roi25Years.toLocaleString("de")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">NPV (diskontiert)</span>
                <span className={`font-semibold tabular-nums text-sm ${res.npv > 0 ? "text-solar-success" : "text-solar-danger"}`}>
                  {res.npv > 0 ? "+" : ""}€{res.npv.toLocaleString("de")}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-solar-border space-y-1">
              {res.availableSubsidies.filter(s => s.amount > 0).map(s => (
                <div key={s.id} className="flex justify-between items-center">
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                     className="text-solar-accent text-xs hover:underline">{s.name}</a>
                  <span className="text-solar-success text-xs font-medium">€{s.amount.toLocaleString("de")}</span>
                </div>
              ))}
              {res.availableSubsidies.filter(s => s.type === "loan").map(s => (
                <div key={s.id} className="text-solar-text-muted text-xs">
                  💳 <a href={s.url} target="_blank" rel="noopener noreferrer"
                        className="hover:text-solar-accent">{s.name} (Kredit)</a>
                </div>
              ))}
            </div>
          </div>

          {/* Energy card */}
          <div className="bg-solar-card border border-solar-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-solar-sun" />
              <h3 className="font-semibold text-solar-text">Energieertrag</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Jahresertrag</span>
                <span className="text-solar-text font-bold tabular-nums text-lg">
                  {res.annualProduction.toLocaleString("de")} kWh
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Eigenverbrauch</span>
                <span className="text-solar-accent font-semibold tabular-nums">
                  {res.coveragePercent}% Ihres Verbrauchs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Einspeisung ins Netz</span>
                <span className="text-solar-text font-semibold tabular-nums">
                  {res.gridFeedIn.toLocaleString("de")} kWh/Jahr
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Einspeisevergütung</span>
                <span className="text-solar-success font-semibold tabular-nums">
                  €{res.feedInRevenue}/Jahr
                </span>
              </div>
            </div>

            {/* Mini monthly chart */}
            <div className="mt-4 pt-4 border-t border-solar-border">
              <p className="text-solar-text-muted text-xs mb-2">Monatliche Produktion (kWh)</p>
              <div className="flex items-end gap-1 h-12">
                {res.monthlyProduction.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full bg-solar-accent rounded-sm"
                      style={{ height: `${(val / maxBarHeight) * 40}px`, minHeight: "2px" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-solar-text-muted text-[10px]">Jan</span>
                <span className="text-solar-text-muted text-[10px]">Jun</span>
                <span className="text-solar-text-muted text-[10px]">Dez</span>
              </div>
            </div>
          </div>

          {/* System card */}
          <div className="bg-solar-card border border-solar-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-solar-sun" />
              <h3 className="font-semibold text-solar-text">Ihr System</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Anzahl Panels</span>
                <span className="text-solar-text font-bold tabular-nums text-lg">
                  {res.panelCount} Stück
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Systemleistung</span>
                <span className="text-solar-text font-semibold tabular-nums">
                  {res.systemSizeKwp.toFixed(1)} kWp
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Qualitätsstufe</span>
                <span className="text-solar-accent font-medium">
                  {panelsData.panels[panelTier].name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-solar-text-secondary text-sm">Batteriespeicher</span>
                <span className="text-solar-text font-medium">
                  {activeScenario === "with_battery" ? `${TYPICAL_BATTERY_KWH} kWh` : "Nicht geplant"}
                </span>
              </div>
            </div>
          </div>

          {/* Roof card */}
          <div className="bg-solar-card border border-solar-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-solar-text-secondary" />
              <h3 className="font-semibold text-solar-text">Ihr Dach</h3>
            </div>

            {roof ? (
              <>
                <RoofViewer roofData={roof} />
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-solar-text-secondary text-sm">Nutzfläche</span>
                    <span className="text-solar-text font-semibold tabular-nums">{roofAreaM2} m²</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-solar-text-secondary text-sm">Neigungswinkel</span>
                    <span className="text-solar-text font-semibold">
                      {roof.tilt}° (optimal: {roof.optimalTilt}°)
                    </span>
                  </div>
                  {roof.tiltLossPercent > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-solar-text-secondary text-sm">Neigungsverlust</span>
                      <span className="text-solar-warning font-semibold">−{roof.tiltLossPercent}%</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-solar-text-secondary text-sm">Sonnenstunden/Jahr</span>
                    <span className="text-solar-text font-semibold tabular-nums">
                      {solar.sunHoursPerYear.toLocaleString("de")}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-solar-text-secondary text-sm">Nutzfläche</span>
                  <span className="text-solar-text font-semibold tabular-nums">~{roofAreaM2} m²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-solar-text-secondary text-sm">Optimaler Neigungswinkel</span>
                  <span className="text-solar-text font-semibold">{HANNOVER_OPTIMAL_TILT}°</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-solar-text-secondary text-sm">Sonnenstunden/Jahr</span>
                  <span className="text-solar-text font-semibold tabular-nums">
                    {solar.sunHoursPerYear.toLocaleString("de")}
                  </span>
                </div>
                <p className="text-solar-text-muted text-xs pt-2">
                  Daten via PVGIS (EU JRC). Für präzise Dachanalyse: Foto hochladen.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Full monthly chart */}
        <div className="bg-solar-card border border-solar-border rounded-xl p-5">
          <h3 className="font-semibold text-solar-text mb-6">Monatliche Produktion</h3>
          <div className="flex items-end gap-2 h-40">
            {res.monthlyProduction.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-solar-text-muted text-[10px] tabular-nums">{val}</span>
                <div
                  className="w-full bg-solar-accent hover:bg-[#FF8A65] rounded-t transition-colors"
                  style={{ height: `${(val / maxBarHeight) * 120}px`, minHeight: "4px" }}
                />
                <span className="text-solar-text-muted text-[10px]">{MONTHS_DE[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-solar-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-solar-accent animate-spin" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
