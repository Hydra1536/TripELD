from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta

from .models import Trip
from .serializers import TripSerializer
from .services.routing import calculate_route, calculate_fuel_stops
from .services.hos_calculator import calculate_hos

class TripCreateView(APIView):
    def post(self, request):
        serializer = TripSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        trip = serializer.save()

        distance, duration, path, waypoints = calculate_route(
            trip.current_location, trip.pickup_location, trip.dropoff_location
        )

        fuel_stops = calculate_fuel_stops(distance)

        hos_logs = calculate_hos(
            total_trip_hours=duration,
            total_distance_miles=distance,
            current_cycle_used_hours=trip.current_cycle_used_hours,
            fuel_stops=fuel_stops
        )

        avg_speed = (distance / duration) if duration > 0 else 55.0

        enriched_logs = []
        base_date = trip.created_at.date()
        total_days = len(hos_logs)
        cumulative_miles_before = 0.0
        rest_stops = []

        for entry in hos_logs:
            day_index = entry["day"] - 1
            the_date = base_date + timedelta(days=day_index)

            if entry["day"] == 1:
                _from = trip.current_location
            else:
                _from = "Enroute"

            if entry["day"] == total_days:
                _to = trip.dropoff_location
            elif entry["day"] == 1 and entry.get("miles_driven", 0.0) == 0:
                _to = trip.pickup_location
            else:
                _to = "Enroute"

            totals = {"DRIVING": 0.0, "ON_DUTY": 0.0, "OFF_DUTY": 0.0, "SLEEPER_BERTH": 0.0}
            driving_miles_accum = 0.0
            for act in entry["activities"]:
                typ = act["type"]
                dur = act.get("duration", 0.0)
                if typ == "DRIVING":
                    totals["DRIVING"] += dur
                    driving_miles_accum += dur * avg_speed
                elif typ == "ON_DUTY":
                    totals["ON_DUTY"] += dur
                elif typ == "OFF_DUTY":
                    totals["OFF_DUTY"] += dur
                elif typ == "SLEEPER_BERTH":
                    totals["SLEEPER_BERTH"] += dur

                # detect rest stops (SLEEPER_BERTH and OFF_DUTY of significant length)
                if typ == "SLEEPER_BERTH" and dur > 0:
                    mile_marker = round(cumulative_miles_before + driving_miles_accum, 2)
                    rest_stops.append({
                        "day": entry["day"],
                        "type": "SLEEPER_BERTH",
                        "start": act.get("start"),
                        "duration": dur,
                        "mile_marker": mile_marker
                    })
                if typ == "OFF_DUTY" and dur >= 0.5:
                    mile_marker = round(cumulative_miles_before + driving_miles_accum, 2)
                    rest_stops.append({
                        "day": entry["day"],
                        "type": "OFF_DUTY",
                        "start": act.get("start"),
                        "duration": dur,
                        "mile_marker": mile_marker
                    })

            cumulative_miles_before += entry.get("miles_driven", 0.0)

            enriched = {
                "day": entry["day"],
                "date": the_date.isoformat(),
                "from": _from,
                "to": _to,
                "total_miles_driving_today": entry.get("miles_driven", 0.0),
                "total_hours": entry.get("total_hours", 0.0),
                "driving_hours": entry.get("driving_hours", 0.0),
                "on_duty_hours": entry.get("on_duty_hours", 0.0),
                "off_duty_hours": entry.get("off_duty_hours", 0.0),
                "sleeper_hours": entry.get("sleeper_hours", 0.0),
                "totals": totals,
                "activities": entry["activities"]
            }
            enriched_logs.append(enriched)

        return Response({
            "message": "Trip created successfully",
            "trip": TripSerializer(trip).data,
            "route_info": {
                "total_distance_miles": distance,
                "total_duration_hours": duration,
                "fuel_stops": fuel_stops,
                "path": path,
                "waypoints": waypoints,
                "rest_stops": rest_stops
            },
            "hos_logs": enriched_logs
        }, status=status.HTTP_201_CREATED)
