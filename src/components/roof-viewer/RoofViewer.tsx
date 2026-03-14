"use client";

import { useState } from "react";
import { Home, Camera, CheckCircle } from "lucide-react";
import { RoofAnalysis } from "@/lib/types";

interface RoofViewerProps {
  roofData: RoofAnalysis;
}

function azimuthToDirection(az: number): string {
  const dirs: [number, string][] = [
    [0, "Süd"],
    [45, "Süd-West"],
    [90, "West"],
    [135, "Nord-West"],
    [180, "Nord"],
    [-135, "Nord-Ost"],
    [-90, "Ost"],
    [-45, "Süd-Ost"],
  ];
  return dirs.reduce((closest, entry) =>
    Math.abs(az - entry[0]) < Math.abs(az - closest[0]) ? entry : closest
  )[1];
}

const confidenceConfig = {
  high:   { color: "bg-solar-success", label: "Hohe Genauigkeit" },
  medium: { color: "bg-solar-warning",  label: "Mittlere Genauigkeit" },
  low:    { color: "bg-solar-danger",   label: "Niedrige Genauigkeit" },
};

export function RoofViewer({ roofData }: RoofViewerProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const conf = confidenceConfig[roofData.confidence];
  const direction = azimuthToDirection(roofData.azimuth);
  const tiltIsOptimal = Math.abs(roofData.tilt - roofData.optimalTilt) <= 5;
  const isFlat = roofData.tilt < 5;

  return (
    <div className="rounded-lg overflow-hidden border border-solar-border">
      {/* Satellite image */}
      {roofData.satelliteImageUrl && !imgFailed ? (
        <div className="relative">
          <img
            src={roofData.satelliteImageUrl}
            alt="Satellitenbild Ihres Dachs"
            className="w-full h-48 object-cover"
            onError={() => setImgFailed(true)}
          />
          {/* Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-solar-bg/80 backdrop-blur-sm px-3 py-2 flex items-center gap-4 text-xs">
            <span className="text-solar-text-secondary">
              Ausrichtung: <span className="text-solar-text font-medium">{direction}</span>
            </span>
            <span className="text-solar-text-secondary">
              Neigung:{" "}
              <span className="text-solar-text font-medium">
                {roofData.tilt}°
                {tiltIsOptimal && <CheckCircle className="inline w-3 h-3 text-solar-success ml-1" />}
              </span>
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <span className={`w-2 h-2 rounded-full ${conf.color}`} />
              <span className="text-solar-text-muted">{conf.label}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="h-36 bg-solar-bg flex flex-col items-center justify-center gap-2">
          <Home className="w-8 h-8 text-solar-text-muted" />
          <p className="text-solar-text-muted text-sm">Kein Satellitenbild verfügbar</p>
          <span className="flex items-center gap-1 text-xs">
            <span className={`w-2 h-2 rounded-full ${conf.color}`} />
            <span className="text-solar-text-muted">{conf.label}</span>
          </span>
        </div>
      )}

      {/* Flat roof notice */}
      {isFlat && (
        <div className="px-3 py-2 bg-solar-warning/10 border-t border-solar-warning/30">
          <p className="text-solar-warning text-xs">
            Flachdach erkannt — Aufständerung auf {roofData.optimalTilt}° empfohlen
          </p>
        </div>
      )}

      {/* Photo upload prompt */}
      {roofData.needsPhoto && (
        <div className="px-3 py-2 border-t border-solar-border flex items-center justify-between">
          <p className="text-solar-text-muted text-xs">
            Foto hochladen für präzisere Analyse
          </p>
          <button className="flex items-center gap-1 text-solar-accent text-xs font-medium hover:text-[#FF8A65] transition-colors">
            <Camera className="w-3.5 h-3.5" />
            Foto hochladen
          </button>
        </div>
      )}
    </div>
  );
}
