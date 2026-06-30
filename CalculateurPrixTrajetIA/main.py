import json
from datetime import datetime
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE = Path(__file__).parent

pipeline = joblib.load(BASE / "model_xgboost.pkl")

with open(BASE / "distance_matrix.json", encoding="utf-8") as f:
    _dm = json.load(f)

_distance_lookup: dict[tuple[str, str], dict] = {}
_cities_set: set[str] = set()

for _entry in _dm["distances"]:
    _key = (_entry["Departure"], _entry["Arrival"])
    _distance_lookup[_key] = {
        "DistanceKm": _entry["DistanceKm"],
        "DepartureGovernorate": _entry["DepartureGovernorate"],
        "ArrivalGovernorate": _entry["ArrivalGovernorate"],
    }
    _cities_set.add(_entry["Departure"])
    _cities_set.add(_entry["Arrival"])

CITIES: list[str] = sorted(_cities_set)

FUEL_CONSUMPTION: dict[str, float] = {
    "LIGHT_VEHICLE": 7.5,
    "VAN": 11.0,
    "FOURGON": 13.0,
    "HEAVY_TRUCK": 25.0,
}

FUEL_PRICE: dict[str, float] = {"Diesel": 1.85, "Petrol": 1.99}

SEASON_ORD: dict[int, int] = {
    1: 1, 2: 1, 12: 1,          # Winter
    3: 2, 4: 2, 5: 2,            # Spring
    6: 3, 7: 3, 8: 3,            # Summer
    9: 4, 10: 4, 11: 4,          # Autumn
}

app = FastAPI(title="XparkGMAO — AI Trip Price Predictor", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    departure: str
    arrival: str
    vehicle_type: str = "LIGHT_VEHICLE"
    fuel_type: str = "Diesel"
    date_depart: str          # ISO datetime "2026-06-30T09:00"
    cargo_weight: float = 0.0
    passenger_count: int = 1
    luggage_weight: float = 0.0
    has_autoroute: bool = False
    traffic_condition: str = "Normal"   # Heavy | Light | Normal
    weather_condition: str = "Sunny"    # Foggy | Rainy | Sunny


@app.get("/health")
def health():
    return {"status": "healthy", "cities": len(CITIES), "model": "XGBoost v1"}


@app.get("/cities")
def get_cities():
    return {"cities": CITIES}


@app.post("/predict")
def predict(req: PredictRequest):
    key = (req.departure, req.arrival)
    if key not in _distance_lookup:
        raise HTTPException(
            status_code=404,
            detail=f"Distance inconnue pour la paire '{req.departure}' → '{req.arrival}'",
        )

    info = _distance_lookup[key]
    dist: float = info["DistanceKm"]

    try:
        dt = datetime.fromisoformat(req.date_depart)
    except ValueError:
        raise HTTPException(status_code=422, detail="Format de date invalide. Attendu: YYYY-MM-DDTHH:MM")

    speed = 80.0
    travel_hours = dist / speed
    fuel_cons = FUEL_CONSUMPTION.get(req.vehicle_type, 7.5)
    fuel_price = FUEL_PRICE.get(req.fuel_type, 1.85)
    toll_cost = 12.0 if req.has_autoroute else 0.0
    driver_allowance = 15.0
    driver_hourly_rate = 5.0

    fuel_cost = dist * fuel_cons / 100.0 * fuel_price
    labor_cost = travel_hours * driver_hourly_rate
    is_long_trip = 1 if dist > 200 else 0
    is_high_traffic = 1 if req.traffic_condition == "Heavy" else 0
    day_iso = dt.isoweekday()           # 1=Mon, 7=Sun
    is_weekend = 1 if day_iso in (6, 7) else 0
    hour = dt.hour
    is_peak_hour = 1 if hour in (7, 8, 9, 16, 17, 18) else 0
    season_ord = SEASON_ORD[dt.month]
    cargo_per_km = req.cargo_weight / dist if dist > 0 else 0.0

    row = {
        "DistanceKm": [dist],
        "TravelDurationHours": [travel_hours],
        "Speed_kmh": [speed],
        "CargoWeight": [req.cargo_weight],
        "PassengerCount": [req.passenger_count],
        "LuggageWeight": [req.luggage_weight],
        "FuelConsumptionPer100Km": [fuel_cons],
        "FuelPricePerLiter": [fuel_price],
        "HasAutoroute": [int(req.has_autoroute)],
        "EstimatedTollCostDt": [toll_cost],
        "DriverTripAllowanceDt": [driver_allowance],
        "DriverHourlyRate": [driver_hourly_rate],
        "FuelCostEstimate": [fuel_cost],
        "LaborCostEstimate": [labor_cost],
        "IsLongTrip": [is_long_trip],
        "IsHighTraffic": [is_high_traffic],
        "IsWeekend": [is_weekend],
        "IsPeakHour": [is_peak_hour],
        "SeasonOrd": [season_ord],
        "CargoPerKm": [cargo_per_km],
        "DayOfWeekIso": [day_iso],
        "HourOfDay": [hour],
        "VehicleType": [req.vehicle_type],
        "FuelType": [req.fuel_type],
        "TrafficCondition": [req.traffic_condition],
        "WeatherCondition": [req.weather_condition],
        "DepartureGovernorate": [info["DepartureGovernorate"]],
        "ArrivalGovernorate": [info["ArrivalGovernorate"]],
    }

    df = pd.DataFrame(row)
    predicted = float(pipeline.predict(df)[0])

    return {
        "predicted_cost_tnd": round(predicted, 2),
        "distance_km": dist,
        "travel_hours": round(travel_hours, 2),
        "departure_governorate": info["DepartureGovernorate"],
        "arrival_governorate": info["ArrivalGovernorate"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
