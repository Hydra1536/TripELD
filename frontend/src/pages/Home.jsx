// D:\TripCop\frontend\src/pages/Home.jsx
import React, { useState } from "react";
import { createTrip } from "../services/api";
import EldLog from "../components/EldLog";
import MapView from "../components/MapView";

const Home = () => {
  const [form, setForm] = useState({
    current_location: "",
    pickup_location: "",
    dropoff_location: "",
    current_cycle_used_hours: 0,
  });

  const [logs, setLogs] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [fuelStops, setFuelStops] = useState([]);
  const [restStops, setRestStops] = useState([]);
  const [routeDistance, setRouteDistance] = useState(0);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submitTrip = async () => {
    try {
      const res = await createTrip(form);

      setLogs(res.data.hos_logs || []);
      setRoutePath(res.data.route_info?.path || []);
      setWaypoints(res.data.route_info?.waypoints || []);
      setFuelStops(res.data.route_info?.fuel_stops || []);
      setRestStops(res.data.route_info?.rest_stops || []);
      setRouteDistance(res.data.route_info?.total_distance_miles || 0);
    } catch (err) {
      console.error("Trip creation failed:", err);
      alert("Failed to generate trip. Check backend.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4" align="center">ELD Trip Planner</h1>

      <div className="grid gap-3 mb-6">
        <input name="current_location" placeholder="Current Location (e.g., Los Angeles, CA)" onChange={handleChange} className="border p-2" />
        <input name="pickup_location" placeholder="Pickup Location (e.g., Phoenix, AZ)" onChange={handleChange} className="border p-2" />
        <input name="dropoff_location" placeholder="Dropoff Location (e.g., Dallas, TX)" onChange={handleChange} className="border p-2" />
        <input name="current_cycle_used_hours" type="number" placeholder="Cycle Used (hrs)" onChange={handleChange} className="border p-2" />

        <button onClick={submitTrip} className="bg-blue-600 text-white p-2 rounded">Generate Logs</button>
      </div>

      {routePath.length > 0 && (
        <MapView path={routePath} waypoints={waypoints} fuelStops={fuelStops} restStops={restStops} routeDistance={routeDistance} />
      )}

      {logs.map((day, idx) => <EldLog key={idx} dayLog={day} />)}
    </div>
  );
};

export default Home;
