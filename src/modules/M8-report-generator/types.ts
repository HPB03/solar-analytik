import { CalculationSession } from "@/lib/types";

export type { CalculationSession } from "@/lib/types";

export interface Report {
  session: CalculationSession;
  generatedAt: string;
  shareUrl?: string;
}
