// src/hooks/use-geolocation.ts
import { useEffect, useState } from "react";

type Coords = {
  lat: number;
  lng: number;
};

type GeolocationState = {
  coords: Coords | null;
  loading: boolean;
  error: string | null;
};

export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("La géolocalisation n'est pas supportée par ce navigateur.");
      setLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Impossible de récupérer la position.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { coords, loading, error };
}
