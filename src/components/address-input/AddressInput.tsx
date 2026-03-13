"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { MapboxSuggestion, GeocodeResult } from "@/lib/types";
import { suggestionToGeocodeResult } from "@/modules/M1-geocoding/geocode";

interface AddressInputProps {
  onSelect: (result: GeocodeResult) => void;
  placeholder?: string;
  className?: string;
}

export function AddressInput({
  onSelect,
  placeholder = "Ihre Adresse in Hannover eingeben...",
  className = "",
}: AddressInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setOpen(data.suggestions.length > 0);
      }
    } catch {
      setError("Fehler beim Laden der Vorschläge");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (suggestion: MapboxSuggestion) => {
    const result = suggestionToGeocodeResult(suggestion);
    setQuery(result.formattedAddress);
    setSuggestions([]);
    setOpen(false);

    if (!result.isSupported) {
      setError("Wir arbeiten derzeit nur in der Region Hannover.");
      return;
    }

    setError(null);
    onSelect(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-solar-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="
            w-full pl-12 pr-12 py-4 rounded-lg
            bg-solar-card border border-solar-border
            text-solar-text placeholder-solar-text-muted
            focus:outline-none focus:border-solar-accent
            text-base transition-colors
          "
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {loading && (
          <Loader2 className="absolute right-4 w-5 h-5 text-solar-text-muted animate-spin" />
        )}
        {!loading && query && (
          <MapPin className="absolute right-4 w-5 h-5 text-solar-text-muted" />
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          className="
            absolute z-50 top-full left-0 right-0 mt-1
            bg-solar-card border border-solar-border rounded-lg
            shadow-xl overflow-hidden
          "
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`
                flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                ${i === activeIndex ? "bg-solar-card-hover" : "hover:bg-solar-card-hover"}
                ${i < suggestions.length - 1 ? "border-b border-solar-border" : ""}
              `}
            >
              <MapPin className="w-4 h-4 text-solar-accent mt-0.5 flex-shrink-0" />
              <span className="text-sm text-solar-text leading-snug">{s.place_name}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mt-2 text-solar-danger text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
