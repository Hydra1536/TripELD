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
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Generate particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
  }));

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submitTrip = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${darkMode ? "dark" : ""}`}
    >
      {/* Particle Background */}
      <div className="particle-bg">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-4 fade-in">
        {/* Floating Header */}
        <header className="fixed top-0 left-0 right-0 glass-nav z-50 p-4 border-b animate-slide-down">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">
              ELD Trip Planner
            </h1>
          </div>
        </header>

        {/* Main Content with top padding for header */}
        <div className="pt-20">
          {/* Form Card */}
          <div className="glass-card rounded-xl p-6 mb-8 hover:shadow-2xl transition-shadow duration-300 slide-up">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Plan Your Trip
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <input
                name="current_location"
                placeholder="Current Location (e.g., Los Angeles, CA)"
                onChange={handleChange}
                list="cities"
                className="border border-border rounded-lg p-3 bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <input
                name="pickup_location"
                placeholder="Pickup Location (e.g., Phoenix, AZ)"
                onChange={handleChange}
                list="cities"
                className="border border-border rounded-lg p-3 bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <input
                name="dropoff_location"
                placeholder="Dropoff Location (e.g., Dallas, TX)"
                onChange={handleChange}
                list="cities"
                className="border border-border rounded-lg p-3 bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
              <input
                name="current_cycle_used_hours"
                type="number"
                placeholder="Cycle Used (hrs)"
                onChange={handleChange}
                className="border border-border rounded-lg p-3 bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>
            <datalist id="cities">
              <option value="Los Angeles, CA" />
              <option value="Phoenix, AZ" />
              <option value="Dallas, TX" />
              <option value="Chicago, IL" />
              <option value="Houston, TX" />
              <option value="New York, NY" />
              <option value="San Francisco, CA" />
              <option value="Seattle, WA" />
              <option value="Miami, FL" />
              <option value="Atlanta, GA" />
              <option value="Denver, CO" />
              <option value="Boston, MA" />
              <option value="Las Vegas, NV" />
              <option value="Portland, OR" />
            </datalist>
            <button
              onClick={submitTrip}
              disabled={isLoading}
              className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transform hover:scale-105 transition-all duration-200 shadow-lg glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </div>
              ) : (
                "Generate Logs"
              )}
            </button>
          </div>

          {/* Map and Logs */}
          {isLoading ? (
            <div className="space-y-6">
              {/* Skeleton for Map */}
              <div className="glass-card rounded-xl p-4 mb-6 animate-pulse">
                <div className="h-4 bg-muted rounded mb-4 w-1/4"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
              {/* Skeletons for Logs */}
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="glass-card rounded-xl p-6 mb-6 animate-pulse"
                >
                  <div className="flex justify-between mb-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-16 bg-muted rounded w-1/4"></div>
                  </div>
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-18"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {routePath.length > 0 && (
                <div className="slide-up">
                  <MapView
                    path={routePath}
                    waypoints={waypoints}
                    fuelStops={fuelStops}
                    restStops={restStops}
                    routeDistance={routeDistance}
                  />
                </div>
              )}

              <div className="space-y-6">
                {logs.map((day, idx) => (
                  <div
                    key={idx}
                    className="slide-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <EldLog dayLog={day} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Credit */}
        <footer className="mt-12 text-center text-muted-foreground">
          <p>© 2026 MD Rezaul Karim</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
