import { Recommendations } from "./types";
import { RecommendationInput } from "./types";

// ─── Thresholds ────────────────────────────────────────────────────────────

const SHADING_HIGH     = 0.30;  // > 30% → strong shading warning
const SHADING_MODERATE = 0.15;  // > 15% → moderate shading note
const ROOF_SMALL_M2    = 15;    // < 15 m² usable → too small warning
const FLAT_ROOF_DEG    = 5;     // < 5° pitch → flat roof
const TILT_LOSS_HIGH   = 20;    // > 20% tilt loss → warn
const NORTH_FACING     = 120;   // |azimuth| > 120° → north warning
const COVERAGE_LOW     = 30;    // < 30% self-consumption → battery helpful
const COVERAGE_HIGH    = 65;    // > 65% → battery less necessary

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, unit = "€"): string {
  return `${unit}${n.toLocaleString("de")}`;
}

// ─── Sub-generators ─────────────────────────────────────────────────────────

function buildMainRecommendation(input: RecommendationInput): string {
  const { energy, financial } = input;
  const { verdict, paybackYears, annualSavings } = financial;

  if (verdict === "profitable") {
    return (
      `Ihre Solaranlage mit ${energy.panelCount} Panels (${energy.systemSizeKwp.toFixed(1)} kWp) ` +
      `amortisiert sich in ${paybackYears} Jahren und spart ${fmt(annualSavings)} pro Jahr. ` +
      `Eine klare Empfehlung zur Installation.`
    );
  }

  if (verdict === "marginal") {
    return (
      `Eine Anlage mit ${energy.panelCount} Panels ist möglich, die Amortisation ` +
      `dauert jedoch ${paybackYears} Jahre. Holen Sie mehrere Angebote ein — ` +
      `ein guter Installateurspreis kann die Rentabilität deutlich verbessern.`
    );
  }

  return (
    `Bei einer Amortisationszeit von ${paybackYears} Jahren lohnt sich die Anlage ` +
    `unter aktuellen Bedingungen kaum. Erwägen Sie eine kleinere Anlage oder ` +
    `warten Sie auf günstigere Panelpreise.`
  );
}

function buildTiltAdvice(input: RecommendationInput): string {
  const { roof } = input;
  const { tilt, optimalTilt, tiltLossPercent, canAdjustTilt } = roof;
  const isFlat = tilt < FLAT_ROOF_DEG;

  if (isFlat) {
    return (
      `Ihr Dach ist nahezu flach (${tilt}°). Mit einer Aufständerung auf ${optimalTilt}° ` +
      `Südausrichtung können Sie die maximale Leistung herausholen. ` +
      `Die Montagekosten erhöhen sich leicht, aber der Mehrertrag lohnt sich.`
    );
  }

  if (tiltLossPercent > TILT_LOSS_HIGH && canAdjustTilt) {
    return (
      `Ihr aktueller Neigungswinkel (${tilt}°) weicht vom Optimum (${optimalTilt}°) ab — ` +
      `Verlust ca. ${tiltLossPercent}%. Mit verstellbaren Halterungen lässt sich ` +
      `dieser Verlust auf unter 5% reduzieren.`
    );
  }

  if (Math.abs(tilt - optimalTilt) <= 5) {
    return (
      `Ihr Dachneigungswinkel (${tilt}°) liegt nahe am Optimum für Hannover (${optimalTilt}°). ` +
      `Der Ertragsverlust durch den Winkel beträgt weniger als 1% — ideal.`
    );
  }

  return (
    `Neigungswinkel ${tilt}°, Optimum für Hannover: ${optimalTilt}°. ` +
    `Verlust durch Abweichung: ${tiltLossPercent}%.`
  );
}

function buildBatteryAdvice(input: RecommendationInput): string {
  const { energy, financial, userInput } = input;
  const { coveragePercent } = energy;
  const { wantsBattery, hasEV } = userInput;
  const batteryDiff =
    financial.annualSavings > 0
      ? Math.round(
          (energy.gridFeedIn * 0.31 * 0.4) // rough extra savings from battery
        )
      : 0;

  if (hasEV) {
    return (
      `Mit Ihrem Elektroauto ist ein Batteriespeicher besonders sinnvoll — ` +
      `Sie können überschüssigen Solarstrom direkt zum Laden nutzen und sparen ` +
      `deutlich bei den Ladekosten. Empfehlung: Speicher ≥ 7,5 kWh.`
    );
  }

  if (coveragePercent < COVERAGE_LOW) {
    return (
      `Ihr Eigenverbrauch liegt bei nur ${coveragePercent}%. Ein Batteriespeicher (7,5 kWh) ` +
      `würde ihn auf ca. 65–70% erhöhen und zusätzlich ~${fmt(batteryDiff)}/Jahr sparen. ` +
      `Stark empfohlen.`
    );
  }

  if (coveragePercent >= COVERAGE_HIGH) {
    if (wantsBattery === "yes") {
      return (
        `Ihr Eigenverbrauch ist bereits gut (${coveragePercent}%). Ein Speicher bringt noch ` +
        `etwas mehr Unabhängigkeit, ist aber kein Muss. Bei steigenden Strompreisen ` +
        `lohnt er sich langfristig.`
      );
    }
    return (
      `Ihr Eigenverbrauch (${coveragePercent}%) ist bereits auf gutem Niveau. ` +
      `Eine Batterie wäre eine Option, ist aber nicht zwingend notwendig.`
    );
  }

  return (
    `Mit einem Batteriespeicher steigt Ihr Eigenverbrauch von ${coveragePercent}% ` +
    `auf etwa 65–70%. Das rechnet sich besonders bei hohen Strompreisen.`
  );
}

function buildTimingAdvice(input: RecommendationInput): string {
  const { financial } = input;

  if (financial.verdict === "profitable") {
    return (
      `Jetzt ist ein guter Zeitpunkt: Panelpreise sind auf dem historischen Tief, ` +
      `und die Einspeisevergütung von ${(0.0812 * 100).toFixed(1)} Ct/kWh gilt für ` +
      `alle 2024 in Betrieb genommenen Anlagen für 20 Jahre. Nicht warten.`
    );
  }

  if (financial.verdict === "marginal") {
    return (
      `Holen Sie mindestens 3 Angebote ein — die Preisspanne zwischen Installateuren ` +
      `beträgt oft 20–30%. Ein gutes Angebot kann die Amortisation um 2–3 Jahre verkürzen.`
    );
  }

  return (
    `Panelpreise sinken weiter. In 1–2 Jahren könnte sich die Wirtschaftlichkeit ` +
    `verbessern. Alternativ: nur Südseite belegen und kleinere Anlage planen.`
  );
}

function buildWarnings(input: RecommendationInput): string[] {
  const { roof, energy } = input;
  const warnings: string[] = [];

  // Shading
  if (roof.shadingFactor >= SHADING_HIGH) {
    warnings.push(
      `Starke Beschattung (${Math.round(roof.shadingFactor * 100)}% Verlust) — ` +
      `prüfen Sie, ob Bäume oder Nachbargebäude zurückgeschnitten werden können.`
    );
  } else if (roof.shadingFactor >= SHADING_MODERATE) {
    warnings.push(
      `Moderate Beschattung (${Math.round(roof.shadingFactor * 100)}% Verlust) — ` +
      `Optimierer oder Mikrowechselrichter können den Effekt auf einzelne Panels begrenzen.`
    );
  }

  // Small roof
  if (roof.roofArea < ROOF_SMALL_M2) {
    warnings.push(
      `Geringe Nutzfläche (${roof.roofArea} m²) — nur ${energy.panelCount} Panels möglich. ` +
      `Erwägen Sie Hochleistungspanels (>420 Wp) für maximalen Ertrag auf kleiner Fläche.`
    );
  }

  // Flat roof
  if (roof.tilt < FLAT_ROOF_DEG) {
    warnings.push(
      `Flachdach erkannt — ohne Aufständerung drohen Wasseransammlungen und ` +
      `bis zu 25% Minderertrag. Aufständerung auf 30–35° dringend empfohlen.`
    );
  }

  // North-facing
  if (Math.abs(roof.azimuth) > NORTH_FACING) {
    warnings.push(
      `Nördliche Dachausrichtung — Ertragsverlust bis zu 30% gegenüber Südseite. ` +
      `Falls vorhanden: Süd- oder Westseite bevorzugen.`
    );
  }

  // Large tilt loss
  if (roof.tiltLossPercent > TILT_LOSS_HIGH && roof.tilt >= FLAT_ROOF_DEG) {
    warnings.push(
      `Neigungsverlust ${roof.tiltLossPercent}% — Winkel weicht stark vom Optimum ab.`
    );
  }

  // Low confidence data
  if (roof.confidence === "low") {
    warnings.push(
      `Dachanalyse mit geringer Sicherheit — laden Sie ein Foto hoch für ` +
      `präzisere Flächenberechnung und Schattenanalyse.`
    );
  }

  // Very small system
  if (energy.systemSizeKwp < 2) {
    warnings.push(
      `Sehr kleine Anlage (${energy.systemSizeKwp.toFixed(1)} kWp) — ` +
      `Fixkosten für Anschluss und Wechselrichter sind unverhältnismäßig hoch.`
    );
  }

  return warnings;
}

// ─── Main export ────────────────────────────────────────────────────────────

export function generateRecommendations(input: RecommendationInput): Recommendations {
  return {
    mainRecommendation: buildMainRecommendation(input),
    optimalSystemSize:  `${input.energy.panelCount} Panels, ${input.energy.systemSizeKwp.toFixed(1)} kWp`,
    tiltAdvice:         buildTiltAdvice(input),
    batteryAdvice:      buildBatteryAdvice(input),
    timingAdvice:       buildTimingAdvice(input),
    warnings:           buildWarnings(input),
  };
}
