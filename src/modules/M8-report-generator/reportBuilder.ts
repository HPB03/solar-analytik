import { CalculationSession } from "@/lib/types";
import { Report } from "./types";

// Stub — full report generation in Week 4
export function buildReport(session: CalculationSession): Report {
  return {
    session,
    generatedAt: new Date().toISOString(),
  };
}
