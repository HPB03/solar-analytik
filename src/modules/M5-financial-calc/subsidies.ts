import subsidiesData from "../../../data/subsidies.json";
import { TYPICAL_BATTERY_KWH } from "@/lib/constants";

export function calculateSubsidies(
  systemSizeKwp: number,
  withBattery: boolean
): { total: number; names: string[] } {
  const proklimaSolar = subsidiesData.subsidies.find((s) => s.id === "proklima-solar")!;
  const proklimaBattery = subsidiesData.subsidies.find((s) => s.id === "proklima-battery")!;

  const grants: number[] = [];
  const names: string[] = [];

  const solarAmt = Math.min(
    systemSizeKwp * (proklimaSolar.amountPerKwp ?? 0),
    proklimaSolar.maxAmount ?? 0
  );
  grants.push(solarAmt);
  names.push(`proKlima Solar: €${solarAmt.toFixed(0)}`);

  if (withBattery) {
    const batteryAmt = Math.min(
      TYPICAL_BATTERY_KWH * (proklimaBattery.amountPerKwh ?? 0),
      proklimaBattery.maxAmount ?? 0
    );
    grants.push(batteryAmt);
    names.push(`proKlima Speicher: €${batteryAmt.toFixed(0)}`);
  }

  return {
    total: grants.reduce((a, b) => a + b, 0),
    names,
  };
}
