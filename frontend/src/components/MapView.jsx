import React, { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";

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
    <div style={{ height: 420, width: "100%" }} className="rounded shadow-md mb-6">
      <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
        <FitBounds positions={path} />
        <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Polyline positions={path} pathOptions={{ color: "#2563EB", weight: 6, opacity: 0.95 }} />

        {/* Markers: Current, Pickup, Dropoff with distinct colors */}
        <CircleMarker center={markers[0]} radius={7} pathOptions={{ color: "#111827", fillColor: "#0ea5e9", fillOpacity: 1 }}>
          <Popup>Current (Start)</Popup>
        </CircleMarker>

        <CircleMarker center={markers[1]} radius={7} pathOptions={{ color: "#ebf800", fillColor: "#c1cb31", fillOpacity: 1 }}>
          <Popup>Pickup</Popup>
        </CircleMarker>

        <CircleMarker center={markers[2]} radius={7} pathOptions={{ color: "#7c2d12", fillColor: "#ff0808", fillOpacity: 1 }}>
          <Popup>Dropoff</Popup>
        </CircleMarker>

        {/* Fuel stops: orange */}
        {fuelMarkers.map((f, i) => (
          <CircleMarker key={`fuel-${i}`} center={f.coord} radius={6} pathOptions={{ color: "#92400e", fillColor: "#f97316", fillOpacity: 1 }}>
            <Popup>{`Fuel stop at mile ${f.mile_marker}`}</Popup>
          </CircleMarker>
        ))}

        {/* Rest stops: green for sleeper, gray for off-duty */}
        {restMarkers.map((r, i) => (
          <CircleMarker
            key={`rest-${i}`}
            center={r.coord}
            radius={6}
            pathOptions={{ color: r.type === "SLEEPER_BERTH" ? "#065f46" : "#4b5563", fillColor: r.type === "SLEEPER_BERTH" ? "#10B981" : "#9CA3AF", fillOpacity: 1 }}
          >
            <Popup>{`${r.type} (day ${r.day}) — ${r.duration} hr — mile ${r.mile_marker}`}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
