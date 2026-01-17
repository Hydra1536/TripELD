import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const createIcon = (color) => L.divIcon({
  html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #000;"></div>`,
  className: 'custom-marker-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function haversineMiles([lat1, lon1], [lat2, lon2]) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length === 0) return;
    map.fitBounds(positions, { padding: [40, 40] });
  }, [map, positions]);
  return null;
};

const MapView = ({ path = [], waypoints = [], fuelStops = [], restStops = [], routeDistance = 0 }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (path && path.length > 0) {
      setIsLoaded(true);
    }
  }, [path]);

  if (!path || path.length === 0) return null;

  // dedupe waypoints to avoid duplicates
  const uniq = (arr) => {
    const seen = new Set();
    const out = [];
    for (const p of arr || []) {
      if (!p || p.length < 2) continue;
      const key = `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(p);
      }
    }
    return out;
  };

  const uniqueWaypoints = uniq(waypoints && waypoints.length ? waypoints : [path[0], path[Math.floor(path.length / 2)], path[path.length - 1]]);
  const markers = [
    uniqueWaypoints[0] || path[0],
    uniqueWaypoints[1] || path[Math.floor(path.length / 2)],
    uniqueWaypoints[2] || path[path.length - 1]
  ];

  // compute cumulative miles along path
  const cumulative = [0];
  for (let i = 1; i < path.length; i++) {
    const seg = haversineMiles(path[i - 1], path[i]);
    cumulative.push(cumulative[cumulative.length - 1] + seg);
  }

  const findPointAtMile = (mile) => {
    if (mile <= 0) return path[0];
    for (let i = 1; i < cumulative.length; i++) {
      if (cumulative[i] >= mile) {
        const prev = cumulative[i - 1];
        const ratio = (mile - prev) / ((cumulative[i] - prev) || 1);
        const lat = path[i - 1][0] + ratio * (path[i][0] - path[i - 1][0]);
        const lon = path[i - 1][1] + ratio * (path[i][1] - path[i - 1][1]);
        return [lat, lon];
      }
    }
    return path[path.length - 1];
  };

  const fuelMarkers = (fuelStops || []).map((fs) => {
    const mile = fs.mile_marker || 0;
    return {
      ...fs,
      coord: findPointAtMile(mile)
    };
  });

  const restMarkers = (restStops || []).map((rs) => ({
    ...rs,
    coord: findPointAtMile(rs.mile_marker || 0)
  }));

  const center = path[0];

  return (
    <div className="glass-card rounded-xl p-4 mb-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Route Map</h3>
        <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
          Total Distance: <strong className="text-blue-600">{routeDistance.toFixed(1)} miles</strong>
        </div>
      </div>
      <div
        style={{ height: window.innerWidth < 768 ? 250 : 300, width: "80%" }}
        className={`rounded-lg overflow-hidden shadow-inner transition-all duration-500 fade-in ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
          <FitBounds positions={path} />
          <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Polyline positions={path} pathOptions={{ color: "#2563EB", weight: 6, opacity: 0.95 }} />

          {/* Markers: Current, Pickup, Dropoff with distinct colors */}
          <Marker position={markers[0]} icon={createIcon("#0ea5e9")}>
            <Popup className="custom-popup">
              <div className="p-2">
                <strong className="text-blue-600">Current (Start)</strong>
              </div>
            </Popup>
          </Marker>

          <Marker position={markers[1]} icon={createIcon("#eab308")}>
            <Popup className="custom-popup">
              <div className="p-2">
                <strong className="text-yellow-600">Pickup</strong>
              </div>
            </Popup>
          </Marker>

          <Marker position={markers[2]} icon={createIcon("#ef4444")}>
            <Popup className="custom-popup">
              <div className="p-2">
                <strong className="text-red-600">Dropoff</strong>
              </div>
            </Popup>
          </Marker>

          {/* Fuel stops: orange */}
          {fuelMarkers.map((f, i) => (
            <Marker key={`fuel-${i}`} position={f.coord} icon={createIcon("#f97316")}>
              <Popup className="custom-popup">
                <div className="p-2">
                  <strong className="text-orange-600">Fuel Stop</strong><br />
                  Mile: {f.mile_marker}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Rest stops: green for sleeper, gray for off-duty */}
          {restMarkers.map((r, i) => (
            <Marker
              key={`rest-${i}`}
              position={r.coord}
              icon={createIcon(r.type === "SLEEPER_BERTH" ? "#10B981" : "#9CA3AF")}
            >
              <Popup className="custom-popup">
                <div className="p-2">
                  <strong className={r.type === "SLEEPER_BERTH" ? "text-green-600" : "text-gray-600"}>
                    {r.type === "SLEEPER_BERTH" ? "Sleeper Berth" : "Off Duty Rest"}
                  </strong><br />
                  Day: {r.day} | Duration: {r.duration} hr<br />
                  Mile: {r.mile_marker}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
