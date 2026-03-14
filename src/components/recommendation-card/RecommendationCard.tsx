"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, TriangleAlert, Battery, Clock, Sun } from "lucide-react";
import { Recommendations } from "@/lib/types";

interface RecommendationCardProps {
  recommendations: Recommendations;
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

function Section({ icon, title, text }: SectionProps) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0 text-solar-accent">{icon}</div>
      <div>
        <p className="text-solar-text text-sm font-medium mb-0.5">{title}</p>
        <p className="text-solar-text-secondary text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export function RecommendationCard({ recommendations: r }: RecommendationCardProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="bg-solar-card border border-solar-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Lightbulb className="w-5 h-5 text-solar-accent" />
        <h3 className="font-semibold text-solar-text">Empfehlungen</h3>
      </div>

      {/* Main recommendation */}
      <div className="bg-solar-bg rounded-lg p-4 mb-5 border border-solar-border">
        <p className="text-solar-text text-sm leading-relaxed">{r.mainRecommendation}</p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <Section
          icon={<Sun className="w-4 h-4" />}
          title="Dachneigung"
          text={r.tiltAdvice}
        />
        <Section
          icon={<Battery className="w-4 h-4" />}
          title="Batteriespeicher"
          text={r.batteryAdvice}
        />
        <Section
          icon={<Clock className="w-4 h-4" />}
          title="Timing"
          text={r.timingAdvice}
        />
      </div>

      {/* Warnings */}
      {r.warnings.length > 0 && (
        <div className="mt-5 pt-4 border-t border-solar-border">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 text-solar-warning text-sm font-medium w-full text-left"
          >
            <TriangleAlert className="w-4 h-4 shrink-0" />
            <span>{r.warnings.length} Hinweis{r.warnings.length > 1 ? "e" : ""} zu beachten</span>
            {showAll
              ? <ChevronUp className="w-4 h-4 ml-auto" />
              : <ChevronDown className="w-4 h-4 ml-auto" />
            }
          </button>

          {showAll && (
            <ul className="mt-3 space-y-2">
              {r.warnings.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm text-solar-text-secondary">
                  <span className="text-solar-warning mt-0.5 shrink-0">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
