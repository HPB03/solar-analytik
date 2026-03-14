import subsidiesData from "../../../data/subsidies.json";
import { TYPICAL_BATTERY_KWH } from "@/lib/constants";
import { SubsidyDetail } from "./types";

export function calculateSubsidies(
  systemSizeKwp: number,
  withBattery: boolean
): { total: number; names: string[]; details: SubsidyDetail[] } {
  const details: SubsidyDetail[] = [];

  for (const s of subsidiesData.subsidies) {
    const cond = s.conditions as Record<string, unknown>;

    // Check eligibility conditions
    if (cond.minSystemKwp && systemSizeKwp < (cond.minSystemKwp as number)) continue;
    if (cond.maxSystemKwp && systemSizeKwp > (cond.maxSystemKwp as number)) continue;
    if (cond.requiresPV && !withBattery) continue; // battery subsidy only with battery

    let amount = 0;

    if (s.id === "proklima-solar") {
      amount = Math.min(
        systemSizeKwp * ((s as { amountPerKwp?: number }).amountPerKwp ?? 0),
        (s as { maxAmount?: number }).maxAmount ?? 0
      );
    } else if (s.id === "proklima-battery" && withBattery) {
      amount = Math.min(
        TYPICAL_BATTERY_KWH * ((s as { amountPerKwh?: number }).amountPerKwh ?? 0),
        (s as { maxAmount?: number }).maxAmount ?? 0
      );
    } else if (s.id === "kfw-270") {
      // KfW is a loan — show as info (amount = 0 grant, but notable)
      amount = 0;
    } else if (s.id === "mwst-befreiung") {
      // 0% MwSt — no direct cash grant
      amount = 0;
    }

    details.push({
      id: s.id,
      name: s.name,
      type: s.type as "grant" | "loan" | "tax",
      amount: Math.round(amount),
      description: s.description,
      url: s.url,
    });
  }

  const grantTotal = details
    .filter((d) => d.type === "grant")
    .reduce((sum, d) => sum + d.amount, 0);

  const names = details
    .filter((d) => d.amount > 0)
    .map((d) => `${d.name}: €${d.amount.toFixed(0)}`);

  return { total: grantTotal, names, details };
}
