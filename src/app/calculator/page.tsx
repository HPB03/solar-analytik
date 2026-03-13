"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { AddressInput } from "@/components/address-input/AddressInput";
import { GeocodeResult } from "@/lib/types";

export default function CalculatorPage() {
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
      <div className="max-w-xl mx-auto px-4 pt-20 pb-32">
        {/* Progress bar */}
        <div className="w-full h-1 bg-solar-border rounded-full mb-12">
          <div className="h-1 bg-solar-accent rounded-full" style={{ width: "33%" }} />
        </div>

        <p className="text-solar-text-muted text-sm mb-2">Schritt 1 von 3</p>
        <h1 className="text-2xl font-bold text-solar-text mb-2">
          Wo befindet sich Ihr Gebäude?
        </h1>
        <p className="text-solar-text-secondary text-sm mb-8">
          Geben Sie Ihre Adresse ein. Wir analysieren Ihr Dach automatisch per Satellit.
        </p>

        <AddressInput onSelect={handleAddressSelect} />
      </div>
    </div>
  );
}
