"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  mapUrl: string;
  onMapUrlChange: (url: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

declare global {
  interface Window {
    initGoogleMapsCallback?: () => void;
  }
}

let googleMapsLoaded = false;
let googleMapsLoading = false;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (googleMapsLoaded) return Promise.resolve();
  if (googleMapsLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (googleMapsLoaded) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  googleMapsLoading = true;
  return new Promise((resolve) => {
    window.initGoogleMapsCallback = () => {
      googleMapsLoaded = true;
      googleMapsLoading = false;
      resolve();
    };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isGoogleMapsUrl(str: string): boolean {
  if (!isValidUrl(str)) return false;
  try {
    const url = new URL(str);
    return (
      url.hostname.includes("google.com") ||
      url.hostname.includes("goo.gl") ||
      url.hostname.includes("maps.app.goo.gl")
    );
  } catch {
    return false;
  }
}

export default function LocationPicker({
  value,
  onChange,
  mapUrl,
  onMapUrlChange,
  id,
  placeholder,
  className,
  ...ariaProps
}: LocationPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasApiKey = !!apiKey;

  // Set up Google Places Autocomplete on the input
  useEffect(() => {
    if (!hasApiKey || !inputRef.current) return;

    let mounted = true;

    loadGoogleMaps(apiKey!).then(() => {
      if (!mounted || !inputRef.current) return;
      if (autocompleteRef.current) return;

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["geocode", "establishment"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          onChange(place.formatted_address);
        } else if (place.name) {
          onChange(place.name);
        }
        // Auto-set map URL from the place
        if (place.url) {
          onMapUrlChange(place.url);
        } else if (place.place_id) {
          onMapUrlChange(`https://www.google.com/maps/place/?q=place_id:${place.place_id}`);
        }
      });

      autocompleteRef.current = autocomplete;
    });

    return () => {
      mounted = false;
    };
  }, [hasApiKey, apiKey, onChange, onMapUrlChange]);

  // Initialize map when modal opens
  useEffect(() => {
    if (!mapOpen || !hasApiKey || !mapContainerRef.current) return;

    let mounted = true;

    loadGoogleMaps(apiKey!).then(() => {
      if (!mounted || !mapContainerRef.current) return;

      const center = mapCenter || { lat: 39.8283, lng: -98.5795 };

      const map = new google.maps.Map(mapContainerRef.current, {
        center,
        zoom: mapCenter ? 15 : 4,
        mapId: "location-picker-map",
      });

      mapInstanceRef.current = map;
      geocoderRef.current = new google.maps.Geocoder();

      if (mapCenter) {
        const marker = new google.maps.Marker({
          position: mapCenter,
          map,
          draggable: true,
        });
        markerRef.current = marker;

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (pos && geocoderRef.current) {
            geocoderRef.current.geocode({ location: pos }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                onChange(results[0].formatted_address);
                onMapUrlChange(`https://www.google.com/maps?q=${pos.lat()},${pos.lng()}`);
              }
            });
          }
        });
      }

      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        const latLng = e.latLng;
        if (!latLng) return;

        if (markerRef.current) {
          markerRef.current.setPosition(latLng);
        } else {
          const marker = new google.maps.Marker({
            position: latLng,
            map,
            draggable: true,
          });
          markerRef.current = marker;

          marker.addListener("dragend", () => {
            const pos = marker.getPosition();
            if (pos && geocoderRef.current) {
              geocoderRef.current.geocode({ location: pos }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                  onChange(results[0].formatted_address);
                  onMapUrlChange(`https://www.google.com/maps?q=${pos.lat()},${pos.lng()}`);
                }
              });
            }
          });
        }

        if (geocoderRef.current) {
          geocoderRef.current.geocode({ location: latLng }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              onChange(results[0].formatted_address);
              onMapUrlChange(`https://www.google.com/maps?q=${latLng.lat()},${latLng.lng()}`);
            }
          });
        }
      });
    });

    return () => {
      mounted = false;
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [mapOpen, hasApiKey, apiKey, mapCenter, onChange, onMapUrlChange]);

  const handleOpenMap = useCallback(() => {
    if (!hasApiKey) {
      const query = value.trim() || "";
      const url = query
        ? `https://www.google.com/maps/search/${encodeURIComponent(query)}`
        : "https://www.google.com/maps";
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (value.trim() && googleMapsLoaded) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: value.trim() }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          setMapCenter({ lat: loc.lat(), lng: loc.lng() });
        }
        setMapOpen(true);
      });
    } else {
      setMapCenter(null);
      setMapOpen(true);
    }
  }, [hasApiKey, value]);

  return (
    <div className="space-y-2">
      {/* Location text input + Map button */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          aria-invalid={ariaProps["aria-invalid"]}
          aria-describedby={ariaProps["aria-describedby"]}
        />
        <button
          type="button"
          onClick={handleOpenMap}
          title={hasApiKey ? "Pick location on map" : "Open in Google Maps"}
          className="shrink-0 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-sm font-medium">Map</span>
        </button>
      </div>

      {/* Map link input */}
      <div>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={mapUrl}
            onChange={(e) => onMapUrlChange(e.target.value)}
            placeholder="Paste Google Maps link here (optional)"
            className="w-full text-sm rounded-md border border-gray-200 px-3 py-1.5 text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        {mapUrl && isGoogleMapsUrl(mapUrl) && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            View on Google Maps
          </a>
        )}
        {mapUrl && isValidUrl(mapUrl) && !isGoogleMapsUrl(mapUrl) && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open map link
          </a>
        )}
      </div>

      {/* Map modal (API key only) */}
      {mapOpen && hasApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                Click on the map to select a location
              </h3>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-medium"
              >
                Close
              </button>
            </div>
            <div
              ref={mapContainerRef}
              className="w-full h-96"
            />
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600 truncate flex-1 mr-4">
                {value || "Click on the map to select a location"}
              </p>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
