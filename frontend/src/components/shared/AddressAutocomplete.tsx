import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google: typeof google;
  }
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: [number, number]) => void;
  placeholder?: string;
  error?: string;
  onLocationCapture?: () => void;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  placeholder = "Start typing your address...",
  error,
  onLocationCapture,
}: AddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Wait for Google Maps to be available
        if (window.google?.maps?.places) {
          setIsLoaded(true);
          initAutocomplete();
        } else {
          // Load places library using the bootstrap loader
          await google.maps.importLibrary("places");
          setIsLoaded(true);
          initAutocomplete();
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
      }
    };

    loadGoogleMaps();
  }, []);

  const initAutocomplete = () => {
    if (!inputRef.current || !window.google) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "in" }, // Restrict to India
      fields: ["formatted_address", "geometry", "address_components"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.error("No geometry found for place");
        return;
      }

      const address = place.formatted_address || "";
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();

      onChange(address, [lng, lat]); // GeoJSON format: [longitude, latitude]
    });

    autocompleteRef.current = autocomplete;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "glass-input rounded-xl flex items-center gap-3 px-4",
          error && "border-red-500/50",
        )}
      >
        <MapPin size={20} className="text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
          disabled={!isLoaded}
        />
      </div>

      {error && <p className="text-red-400 text-xs px-2">{error}</p>}

      {!isLoaded && (
        <p className="text-white/60 text-xs px-2">
          Loading address suggestions...
        </p>
      )}

      {onLocationCapture && (
        <button
          type="button"
          onClick={onLocationCapture}
          className="w-full glass-button rounded-xl py-2.5 flex items-center justify-center gap-2 text-white text-sm hover:bg-white/20 transition-all mt-2"
        >
          <MapPin size={16} />
          Use Current Location
        </button>
      )}
    </div>
  );
};

export default AddressAutocomplete;
