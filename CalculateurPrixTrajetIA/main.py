import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
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

# ── GMAO vehicle type → AI model vehicle type ────────────────────────────────
# GMAO: BERLINE, SUV, UTILITAIRE, CAMION, MINIBUS, MOTO, VAN, BUS, AUTRE
# Model: LIGHT_VEHICLE, VAN, FOURGON, HEAVY_TRUCK
GMAO_VEHICLE_MAP: dict[str, str] = {
    "BERLINE":    "LIGHT_VEHICLE",
    "SUV":        "LIGHT_VEHICLE",
    "MOTO":       "LIGHT_VEHICLE",
    "AUTRE":      "LIGHT_VEHICLE",
    "UTILITAIRE": "FOURGON",
    "MINIBUS":    "VAN",
    "VAN":        "VAN",
    "CAMION":     "HEAVY_TRUCK",
    "BUS":        "HEAVY_TRUCK",
}

# GMAO fuel type → AI model fuel type
GMAO_FUEL_MAP: dict[str, str] = {
    "DIESEL":     "Diesel",
    "ESSENCE":    "Petrol",
    "HYBRIDE":    "Diesel",
    "ELECTRIQUE": "Diesel",
    "GPL":        "Petrol",
}

# Default fuel consumption per AI model vehicle type (L/100km)
DEFAULT_FUEL_CONSUMPTION: dict[str, float] = {
    "LIGHT_VEHICLE": 7.5,
    "VAN":           11.0,
    "FOURGON":       13.0,
    "HEAVY_TRUCK":   25.0,
}

FUEL_PRICE: dict[str, float] = {"Diesel": 1.85, "Petrol": 1.99}

SEASON_ORD: dict[int, int] = {
    1: 1, 2: 1, 12: 1,
    3: 2, 4: 2, 5: 2,
    6: 3, 7: 3, 8: 3,
    9: 4, 10: 4, 11: 4,
}

app = FastAPI(title="XparkGMAO — AI Trip Price Predictor", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    departure: str
    arrival: str
    date_depart: str                            # "2026-06-30T09:00"
    # Vehicle — accepts either the GMAO enum value or the AI model type directly
    vehicle_type_gmao: Optional[str] = None    # BERLINE, SUV, CAMION … (preferred)
    vehicle_type: Optional[str] = None          # LIGHT_VEHICLE, VAN … (fallback)
    fuel_type_gmao: Optional[str] = None       # DIESEL, ESSENCE … (preferred)
    fuel_type: Optional[str] = None            # Diesel, Petrol (fallback)
    fuel_consumption_per_100km: Optional[float] = None  # from actual vehicle; overrides default
    has_autoroute: bool = False
    cargo_weight: float = 0.0
    passenger_count: int = 1
    luggage_weight: float = 0.0
    traffic_condition: str = "Normal"
    weather_condition: str = "Sunny"


def _resolve_vehicle_type(req: PredictRequest) -> str:
    if req.vehicle_type_gmao:
        return GMAO_VEHICLE_MAP.get(req.vehicle_type_gmao.upper(), "LIGHT_VEHICLE")
    if req.vehicle_type and req.vehicle_type in DEFAULT_FUEL_CONSUMPTION:
        return req.vehicle_type
    return "LIGHT_VEHICLE"


def _resolve_fuel_type(req: PredictRequest) -> str:
    if req.fuel_type_gmao:
        return GMAO_FUEL_MAP.get(req.fuel_type_gmao.upper(), "Diesel")
    if req.fuel_type in ("Diesel", "Petrol"):
        return req.fuel_type
    return "Diesel"


@app.get("/health")
def health():
    return {"status": "healthy", "cities": len(CITIES), "model": "XGBoost v2"}


@app.get("/cities")
def get_cities():
    return {"cities": CITIES}


@app.get("/distance")
def get_distance(
    departure: str = Query(..., description="Departure city name"),
    arrival: str = Query(..., description="Arrival city name"),
):
    key = (departure, arrival)
    if key not in _distance_lookup:
        raise HTTPException(
            status_code=404,
            detail=f"Paire inconnue: '{departure}' → '{arrival}'",
        )
    info = _distance_lookup[key]
    dist = info["DistanceKm"]
    return {
        "distance_km": dist,
        "travel_hours": round(dist / 80.0, 2),
        "departure_governorate": info["DepartureGovernorate"],
        "arrival_governorate": info["ArrivalGovernorate"],
    }


@app.post("/predict")
def predict(req: PredictRequest):
    key = (req.departure, req.arrival)
    if key not in _distance_lookup:
        raise HTTPException(
            status_code=404,
            detail=f"Distance inconnue pour '{req.departure}' → '{req.arrival}'",
        )

    info = _distance_lookup[key]
    dist: float = info["DistanceKm"]

    try:
        dt = datetime.fromisoformat(req.date_depart)
    except ValueError:
        raise HTTPException(status_code=422, detail="Format de date invalide. Attendu: YYYY-MM-DDTHH:MM")

    vehicle_type = _resolve_vehicle_type(req)
    fuel_type = _resolve_fuel_type(req)

    speed = 80.0
    travel_hours = dist / speed
    fuel_cons = req.fuel_consumption_per_100km or DEFAULT_FUEL_CONSUMPTION.get(vehicle_type, 7.5)
    fuel_price = FUEL_PRICE.get(fuel_type, 1.85)
    toll_cost = 12.0 if req.has_autoroute else 0.0
    driver_allowance = 15.0
    driver_hourly_rate = 5.0

    fuel_cost = dist * fuel_cons / 100.0 * fuel_price
    labor_cost = travel_hours * driver_hourly_rate
    is_long_trip = 1 if dist > 200 else 0
    is_high_traffic = 1 if req.traffic_condition == "Heavy" else 0
    day_iso = dt.isoweekday()
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
        "VehicleType": [vehicle_type],
        "FuelType": [fuel_type],
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
        "fuel_cost_tnd": round(fuel_cost, 2),
        "labor_cost_tnd": round(labor_cost, 2),
        "toll_cost_tnd": round(toll_cost, 2),
        "driver_allowance_tnd": driver_allowance,
        "vehicle_type_used": vehicle_type,
        "fuel_type_used": fuel_type,
        "departure_governorate": info["DepartureGovernorate"],
        "arrival_governorate": info["ArrivalGovernorate"],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
