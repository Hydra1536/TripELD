MAX_DAILY_DRIVING_HOURS = 11
MAX_DUTY_WINDOW = 14
MAX_CYCLE_HOURS = 70

PICKUP_TIME = 1
DROPOFF_TIME = 1
FUEL_STOP_TIME = 0.5

# Fixed daily schedule (user-provided pattern)
# Times are in hours since midnight
FIXED_DAILY_SCHEDULE = [
    ("OFF_DUTY", 0.0, 6.0, None),  # 12am-6am Off Duty
    ("ON_DUTY", 6.0, 7.5, None),  # 6:00-7:30 On Duty
    ("DRIVING", 7.5, 9.0, None),  # 7:30-9:00 Driving
    ("ON_DUTY", 9.0, 9.5, None),  # 9:00-9:30 On Duty
    ("DRIVING", 9.5, 12.0, None),  # 9:30-12:00 Driving
    ("OFF_DUTY", 12.0, 13.0, None),  # 12:00-13:00 Off Duty
    ("DRIVING", 13.0, 15.0, None),  # 13:00-15:00 Driving
    ("ON_DUTY", 15.0, 15.5, None),  # 15:00-15:30 On Duty
    ("DRIVING", 15.5, 16.0, None),  # 15:30-16:00 Driving
    ("SLEEPER_BERTH", 16.0, 17.75, None),  # 16:00-17:45 Sleeper Berth
    ("DRIVING", 17.75, 19.0, None),  # 17:45-19:00 Driving
    ("ON_DUTY", 19.0, 22.0, None),  # 19:00-22:00 On Duty
    ("OFF_DUTY", 22.0, 24.0, None),  # 22:00-24:00 Off Duty
]


def _duration(h1, h2):
    return round(max(0.0, h2 - h1), 4)


def calculate_hos(
    total_trip_hours,
    total_distance_miles,
    current_cycle_used_hours,
    fuel_stops,
    use_fixed_schedule=True,
):
    """
    FMCSA-aligned HOS engine using fixed daily schedule.

    Key rules implemented:
    - If cycle is exhausted (remaining_cycle_hours <= 0) during a day,
      for the remainder of that day ALL remaining schedule time is OFF_DUTY
      (no ON_DUTY or SLEEPER_BERTH) and no further day logs are produced.
    - If destination is reached before cycle exhaustion, remaining driving blocks
      become ON_DUTY (post-arrival on-duty).
    - Each day is fully filled to 24 hours (no gaps).
    - Fuel stop is added as ON_DUTY only if cycle hours allow; otherwise skipped.
    """
    remaining_trip_hours = float(total_trip_hours)
    remaining_cycle_hours = float(MAX_CYCLE_HOURS - float(current_cycle_used_hours))
    # defensive average speed
    avg_speed_mph = (
        (total_distance_miles / total_trip_hours)
        if (total_trip_hours and total_distance_miles)
        else 55.0
    )

    day = 1
    daily_logs = []

    fuel_stop_used = False

    # If cycle already exhausted before day1, we still generate one day where all remaining schedule becomes OFF_DUTY
    stop_after_this_day = False

    # Loop days
    while len(daily_logs) < 60:
        activities = []
        cycle_exhausted_this_day = remaining_cycle_hours <= 0
        # iterate fixed schedule blocks and ensure each block is fully covered
        for block in FIXED_DAILY_SCHEDULE:
            typ, start, end, reason = block
            block_len = _duration(start, end)

            # If cycle exhausted at this moment, remainder of day is OFF_DUTY (per user rule)
            if remaining_cycle_hours <= 0:
                # append OFF_DUTY covering the whole block time
                activities.append(
                    {
                        "type": "OFF_DUTY",
                        "start": round(start, 4),
                        "end": round(end, 4),
                        "duration": round(block_len, 4),
                    }
                )
                # mark that we will stop after this day (no further logs)
                stop_after_this_day = True
                continue

            if typ == "DRIVING":
                # If there is driving remaining and cycle hours available
                if remaining_trip_hours > 1e-9:
                    # allowed_drive: limited by block, remaining_trip_hours, remaining_cycle_hours, and daily cap
                    allowed_drive = min(
                        block_len,
                        remaining_trip_hours,
                        remaining_cycle_hours,
                        MAX_DAILY_DRIVING_HOURS,
                    )
                    # add driving portion
                    start_actual = start
                    end_actual = start_actual + allowed_drive
                    activities.append(
                        {
                            "type": "DRIVING",
                            "start": round(start_actual, 4),
                            "end": round(end_actual, 4),
                            "duration": round(allowed_drive, 4),
                        }
                    )
                    remaining_trip_hours -= allowed_drive
                    remaining_cycle_hours -= allowed_drive

                    remainder = round(block_len - allowed_drive, 4)
                    # if there's remainder of the block, decide how to fill it:
                    if remainder > 1e-9:
                        # if trip finished and cycle still available -> post-arrival ON_DUTY
                        if remaining_trip_hours <= 1e-9 and remaining_cycle_hours > 0:
                            activities.append(
                                {
                                    "type": "ON_DUTY",
                                    "start": round(end_actual, 4),
                                    "end": round(end_actual + remainder, 4),
                                    "duration": remainder,
                                    "reason": "Post-arrival On Duty",
                                }
                            )
                            # consume cycle hours if available
                            remaining_cycle_hours = max(
                                0.0, remaining_cycle_hours - remainder
                            )
                        else:
                            # either cycle exhausted by driving or can't drive further: remainder becomes OFF_DUTY (per user rule)
                            activities.append(
                                {
                                    "type": "OFF_DUTY",
                                    "start": round(end_actual, 4),
                                    "end": round(end_actual + remainder, 4),
                                    "duration": remainder,
                                }
                            )
                            # if the reason is cycle exhaustion, mark to stop future days
                            if remaining_cycle_hours <= 0:
                                stop_after_this_day = True

                    # insert fuel stop immediately after a driving segment if applicable AND cycle still available
                    if (
                        fuel_stops
                        and (not fuel_stop_used)
                        and allowed_drive > 0
                        and remaining_cycle_hours > 0
                    ):
                        fs_start = round(end_actual + 0.0, 4)
                        fs_end = round(fs_start + FUEL_STOP_TIME, 4)
                        activities.append(
                            {
                                "type": "ON_DUTY",
                                "start": fs_start,
                                "end": fs_end,
                                "duration": round(FUEL_STOP_TIME, 4),
                                "reason": "Fuel stop",
                            }
                        )
                        remaining_cycle_hours = max(
                            0.0, remaining_cycle_hours - FUEL_STOP_TIME
                        )
                        fuel_stop_used = True
                else:
                    # No driving left -> fill this block based on whether cycle was exhausted before arrival
                    # If cycle not exhausted, post-arrival ON_DUTY fills; otherwise OFF_DUTY
                    if remaining_cycle_hours > 0:
                        activities.append(
                            {
                                "type": "ON_DUTY",
                                "start": round(start, 4),
                                "end": round(end, 4),
                                "duration": block_len,
                                "reason": "Post-arrival On Duty",
                            }
                        )
                        remaining_cycle_hours = max(
                            0.0, remaining_cycle_hours - block_len
                        )
                    else:
                        activities.append(
                            {
                                "type": "OFF_DUTY",
                                "start": round(start, 4),
                                "end": round(end, 4),
                                "duration": block_len,
                            }
                        )
                        stop_after_this_day = True

            elif typ == "ON_DUTY":
                # ON_DUTY scheduled: if cycle available, keep ON_DUTY; if cycle exhausted, replace with OFF_DUTY
                if remaining_cycle_hours > 0:
                    activities.append(
                        {
                            "type": "ON_DUTY",
                            "start": round(start, 4),
                            "end": round(end, 4),
                            "duration": block_len,
                            "reason": reason,
                        }
                    )
                    remaining_cycle_hours = max(0.0, remaining_cycle_hours - block_len)
                else:
                    activities.append(
                        {
                            "type": "OFF_DUTY",
                            "start": round(start, 4),
                            "end": round(end, 4),
                            "duration": block_len,
                        }
                    )
                    stop_after_this_day = True

            elif typ == "SLEEPER_BERTH":
                # If cycle available, include sleeper berth; if not, convert to OFF_DUTY (per user rule)
                if remaining_cycle_hours > 0:
                    activities.append(
                        {
                            "type": "SLEEPER_BERTH",
                            "start": round(start, 4),
                            "end": round(end, 4),
                            "duration": block_len,
                        }
                    )
                else:
                    activities.append(
                        {
                            "type": "OFF_DUTY",
                            "start": round(start, 4),
                            "end": round(end, 4),
                            "duration": block_len,
                        }
                    )
                    stop_after_this_day = True

            else:  # OFF_DUTY
                activities.append(
                    {
                        "type": "OFF_DUTY",
                        "start": round(start, 4),
                        "end": round(end, 4),
                        "duration": block_len,
                    }
                )

        # Summarize day
        driving_hours = sum(a["duration"] for a in activities if a["type"] == "DRIVING")
        on_duty_hours = sum(a["duration"] for a in activities if a["type"] == "ON_DUTY")
        off_duty_hours = sum(
            a["duration"] for a in activities if a["type"] == "OFF_DUTY"
        )
        sleeper_hours = sum(
            a["duration"] for a in activities if a["type"] == "SLEEPER_BERTH"
        )
        total_hours = round(
            driving_hours + on_duty_hours + off_duty_hours + sleeper_hours, 4
        )

        miles_today = (
            round(driving_hours * avg_speed_mph, 2) if avg_speed_mph > 0 else 0.0
        )

        daily_logs.append(
            {
                "day": day,
                "activities": activities,
                "driving_hours": round(driving_hours, 4),
                "on_duty_hours": round(on_duty_hours, 4),
                "off_duty_hours": round(off_duty_hours, 4),
                "sleeper_hours": round(sleeper_hours, 4),
                "total_hours": total_hours,
                "miles_driven": miles_today,
            }
        )

        # If cycle exhausted and rule says stop further logs, break here
        if stop_after_this_day:
            break

        # If trip complete, stop
        if remaining_trip_hours <= 1e-9:
            break

        day += 1

    return daily_logs


def calculate_total_hos_hours(daily_logs):
    """Calculate total HOS hours from daily logs"""
    total_hours = 0
    for day_log in daily_logs:
        total_hours += day_log.get("driving_hours", 0)
        total_hours += day_log.get("on_duty_hours", 0)
    return total_hours


def calculate_total_miles(daily_logs):
    """Calculate total miles driven from daily logs"""
    total_miles = 0
    for day_log in daily_logs:
        total_miles += day_log.get("miles_driven", 0)
    return total_miles
