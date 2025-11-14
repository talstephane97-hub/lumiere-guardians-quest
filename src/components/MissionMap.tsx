import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface MissionMapProps {
  mapboxToken: string;
  userId: string;
  targetLat?: number;
  targetLng?: number;
  radiusMeters?: number;
  onLocationValid?: (isValid: boolean, distance: number) => void;
}

const MissionMap = ({ 
  mapboxToken, 
  userId,
  targetLat,
  targetLng,
  radiusMeters = 100,
  onLocationValid 
}: MissionMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const targetMarker = useRef<mapboxgl.Marker | null>(null);
  const [userPosition, setUserPosition] = useState<{lat: number; lng: number} | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [2.3522, 48.8566], // Paris center
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add target marker if coordinates provided
  useEffect(() => {
    if (!map.current || targetLat === undefined || targetLng === undefined) return;

    // Remove existing target marker
    targetMarker.current?.remove();

    // Add target marker with glow effect
    const el = document.createElement('div');
    el.className = 'w-8 h-8 rounded-full bg-primary animate-pulse';
    el.style.boxShadow = '0 0 20px hsl(43 96% 56% / 0.8)';

    targetMarker.current = new mapboxgl.Marker({ element: el })
      .setLngLat([targetLng, targetLat])
      .addTo(map.current);

    // Add radius circle
    if (map.current.getSource('target-radius')) {
      map.current.removeLayer('target-radius-fill');
      map.current.removeSource('target-radius');
    }

    map.current.addSource('target-radius', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [targetLng, targetLat]
        },
        properties: {}
      }
    });

    map.current.addLayer({
      id: 'target-radius-fill',
      type: 'circle',
      source: 'target-radius',
      paint: {
        'circle-radius': {
          stops: [
            [0, 0],
            [20, radiusMeters * 0.075] // Approximate meters to pixels
          ],
          base: 2
        },
        'circle-color': 'hsl(43 96% 56%)',
        'circle-opacity': 0.2,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'hsl(43 96% 56%)',
        'circle-stroke-opacity': 0.5
      }
    });

    // Center on target
    map.current.flyTo({
      center: [targetLng, targetLat],
      zoom: 16,
      duration: 2000
    });
  }, [targetLat, targetLng, radiusMeters]);

  // Track user position
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserPosition({ lat: latitude, lng: longitude });

        // Update user marker
        if (map.current) {
          if (!userMarker.current) {
            const el = document.createElement('div');
            el.className = 'w-4 h-4 rounded-full bg-accent border-2 border-white';
            userMarker.current = new mapboxgl.Marker({ element: el })
              .setLngLat([longitude, latitude])
              .addTo(map.current);
          } else {
            userMarker.current.setLngLat([longitude, latitude]);
          }
        }

        // Save position to database (using any to bypass type errors until types regenerate)
        await (supabase as any)
          .from('player_positions')
          .insert({
            user_id: userId,
            latitude,
            longitude,
            accuracy: accuracy || null,
            mission_context: targetLat && targetLng ? `target_${targetLat}_${targetLng}` : null
          })
          .then((result: any) => {
            if (result.error) {
              console.error('Error saving position:', result.error);
            }
          });

        // Calculate distance if target exists
        if (targetLat !== undefined && targetLng !== undefined && onLocationValid) {
          const distance = calculateDistance(latitude, longitude, targetLat, targetLng);
          const isValid = distance <= radiusMeters;
          onLocationValid(isValid, distance);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [userId, targetLat, targetLng, radiusMeters, onLocationValid]);

  // Calculate distance in meters using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-primary/20">
      <div ref={mapContainer} className="absolute inset-0" />
      {userPosition && (
        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm">
          <p className="text-muted-foreground">Votre position</p>
          <p className="text-foreground font-mono text-xs">
            {userPosition.lat.toFixed(6)}, {userPosition.lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default MissionMap;
