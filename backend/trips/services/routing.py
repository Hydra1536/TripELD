import requests

HEADERS = {"User-Agent": "tripcop-eld-planner"}


def geocode_location(location):
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": location, "format": "json", "limit": 1}
    response = requests.get(url, params=params, headers=HEADERS, timeout=10)
    data = response.json()
    if not data:
        raise Exception(f"Location not found: {location}")
    return float(data[0]["lat"]), float(data[0]["lon"])


def calculate_route(start, pickup, dropoff):
    """
    Calculate route distance, duration, path and waypoints using OSRM.
    Falls back to simple straight-line path if OSRM fails.
    Returns: (distance_miles, duration_hours, path, waypoints_coords)
    """
    start_lat, start_lon = geocode_location(start)
    pickup_lat, pickup_lon = geocode_location(pickup)
    drop_lat, drop_lon = geocode_location(dropoff)

    coordinates = (
        f"{start_lon},{start_lat};{pickup_lon},{pickup_lat};{drop_lon},{drop_lat}"
    )
    osrm_url = f"https://router.project-osrm.org/route/v1/driving/{coordinates}"
    params = {"overview": "full", "geometries": "geojson"}

    try:
        r = requests.get(osrm_url, params=params, headers=HEADERS, timeout=15)
        data = r.json()
        # log for debugging
        print("OSRM RESPONSE code:", data.get("code"))
        if data.get("code") != "Ok":
            raise ValueError("OSRM returned non-Ok code")

        route = data["routes"][0]
        distance_miles = route["distance"] / 1609.34
        duration_hours = route["duration"] / 3600
        path = [[lat, lon] for lon, lat in route["geometry"]["coordinates"]]

        waypoints = data.get("waypoints", [])
        waypoints_coords = []
        for wp in waypoints:
            loc = wp.get("location")
            if loc and len(loc) >= 2:
                waypoints_coords.append([loc[1], loc[0]])

        if len(waypoints_coords) < 3:
            waypoints_coords = [
                [start_lat, start_lon],
                [pickup_lat, pickup_lon],
                [drop_lat, drop_lon],
            ]

        return (
            round(distance_miles, 2),
            round(duration_hours, 2),
            path,
            waypoints_coords,
        )

    except Exception as e:
        print("OSRM failed:", e)
        # fallback straight-line
        path = [
            [start_lat, start_lon],
            [pickup_lat, pickup_lon],
            [drop_lat, drop_lon],
        ]

        # simple haversine distance for estimation
        from math import radians, sin, cos, sqrt, atan2

        def hav(lat1, lon1, lat2, lon2):
            R = 3958.8
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = (
                sin(dlat / 2) ** 2
                + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
            )
            c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return R * c

        distance_miles = hav(start_lat, start_lon, pickup_lat, pickup_lon) + hav(
            pickup_lat, pickup_lon, drop_lat, drop_lon
        )
        duration_hours = distance_miles / 55.0 if distance_miles > 0 else 0.0

        return (
            round(distance_miles, 2),
            round(duration_hours, 2),
            path,
            [
                [start_lat, start_lon],
                [pickup_lat, pickup_lon],
                [drop_lat, drop_lon],
            ],
        )


def calculate_fuel_stops(distance_miles):
    stops = []
    marker = 1000
    while distance_miles > marker:
        stops.append({"mile_marker": marker, "reason": "Fuel stop"})
        marker += 1000
    return stops
