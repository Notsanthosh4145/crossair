"""
Generates a believable list of flights for a given route + date.

There's no real airline inventory here — flights are synthesized
deterministically from (from_city, to_city, date), so the same search
always returns the same results (nice for demos), but different
searches look different.
"""
import hashlib
import random

AIRLINES = [
    ("CrossAir", "CX"),
    ("IndiGo Skies", "IG"),
    ("Vayu Airways", "VY"),
    ("Skyline Express", "SK"),
    ("Aravalli Air", "AA"),
]

# Rough base fare per km-equivalent "hop" — just enough to make longer /
# international-sounding routes cost more than short domestic ones.
DOMESTIC_BASE = 2800
INTERNATIONAL_BASE = 9500

INTERNATIONAL_CITIES = {"Dubai", "Singapore", "London", "New York", "Frankfurt", "Sydney"}


def _seeded_random(from_city, to_city, date):
    seed_str = f"{from_city}-{to_city}-{date}"
    seed = int(hashlib.sha256(seed_str.encode()).hexdigest(), 16) % (2**32)
    return random.Random(seed)


def _rand_time(rnd, start_hour=0, end_hour=23):
    h = rnd.randint(start_hour, end_hour)
    m = rnd.choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
    return f"{h:02d}:{m:02d}"


def _add_minutes(hhmm, minutes):
    h, m = map(int, hhmm.split(":"))
    total = h * 60 + m + minutes
    total %= 24 * 60
    return f"{total // 60:02d}:{total % 60:02d}"


def generate_flights(from_city, to_city, date):
    rnd = _seeded_random(from_city, to_city, date)
    is_intl = from_city in INTERNATIONAL_CITIES or to_city in INTERNATIONAL_CITIES
    base_price = INTERNATIONAL_BASE if is_intl else DOMESTIC_BASE
    base_duration = rnd.randint(320, 620) if is_intl else rnd.randint(70, 190)

    num_flights = rnd.randint(4, 7)
    flights = []
    for i in range(num_flights):
        airline, code = rnd.choice(AIRLINES)
        flight_no = f"{code}{rnd.randint(100, 999)}"
        dep = _rand_time(rnd)
        stops = rnd.choices([0, 1, 2], weights=[0.55, 0.35, 0.10])[0]
        duration_min = base_duration + stops * rnd.randint(45, 110) + rnd.randint(-20, 20)
        duration_min = max(duration_min, 45)
        arr = _add_minutes(dep, duration_min)
        price = base_price + stops * rnd.randint(-400, 200) + rnd.randint(-600, 1800)
        price = max(price, 1500)
        # Round to nearest 10 for tidier numbers.
        price = int(round(price / 10.0)) * 10

        flights.append({
            "id": f"{from_city[:3]}-{to_city[:3]}-{date}-{i}".upper().replace(" ", ""),
            "from": from_city,
            "to": to_city,
            "airline": airline,
            "flightNo": flight_no,
            "dep": dep,
            "arr": arr,
            "durationMin": duration_min,
            "stops": stops,
            "price": price,
        })

    flights.sort(key=lambda f: f["price"])
    return flights
