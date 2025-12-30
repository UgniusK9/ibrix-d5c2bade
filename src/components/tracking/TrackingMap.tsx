import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface TrackingMapProps {
  location?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  carrierName?: string | null;
  lastUpdate?: string | null;
}

// Lithuanian city coordinates fallback
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'vilnius': { lat: 54.6872, lng: 25.2797 },
  'kaunas': { lat: 54.8985, lng: 23.9036 },
  'klaipėda': { lat: 55.7033, lng: 21.1443 },
  'šiauliai': { lat: 55.9349, lng: 23.3137 },
  'panevėžys': { lat: 55.7348, lng: 24.3575 },
  'alytus': { lat: 54.3963, lng: 24.0459 },
  'marijampolė': { lat: 54.5596, lng: 23.3500 },
  'mažeikiai': { lat: 56.3092, lng: 22.3414 },
  'jonava': { lat: 55.0722, lng: 24.2794 },
  'utena': { lat: 55.4983, lng: 25.6033 },
  // Default Lithuania center
  'lietuva': { lat: 55.1694, lng: 23.8813 },
};

function getCityFromLocation(location: string): { lat: number; lng: number } | null {
  const lowerLocation = location.toLowerCase();
  
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (lowerLocation.includes(city)) {
      return coords;
    }
  }
  
  return null;
}

export function TrackingMap({ location, coordinates, carrierName, lastUpdate }: TrackingMapProps) {
  const mapRef = useRef<any>(null);

  // Determine position
  let position: LatLngExpression | null = null;
  let locationLabel = location || 'Lietuva';

  if (coordinates) {
    position = [coordinates.lat, coordinates.lng];
  } else if (location) {
    const cityCoords = getCityFromLocation(location);
    if (cityCoords) {
      position = [cityCoords.lat, cityCoords.lng];
    }
  }

  // Default to Lithuania center if no position
  if (!position) {
    position = [cityCoordinates.lietuva.lat, cityCoordinates.lietuva.lng];
    locationLabel = 'Lietuva';
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('lt-LT', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-premium">
      <div className="p-4 border-b border-border">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Kur yra siunta dabar?
        </h2>
        {location && (
          <p className="text-sm text-muted-foreground mt-1">
            Paskutinė vieta: {location}
            {lastUpdate && ` • ${formatDate(lastUpdate)}`}
          </p>
        )}
        {carrierName && (
          <p className="text-xs text-muted-foreground mt-1">
            Vežėjas: {carrierName}
          </p>
        )}
      </div>
      
      <div className="h-[300px] md:h-[350px] relative">
        <MapContainer
          ref={mapRef}
          center={position}
          zoom={location && coordinates ? 12 : 7}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
          style={{ background: 'hsl(var(--muted))' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={defaultIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-medium">{locationLabel}</p>
                {lastUpdate && (
                  <p className="text-xs text-gray-500">{formatDate(lastUpdate)}</p>
                )}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
