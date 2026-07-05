import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
import xgboost as xgb
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ai-predictor")

BASE = Path(__file__).parent

pipeline = joblib.load(BASE / "model_xgboost.pkl")
logger.info("XGBoost pipeline loaded from pickle")

# Re-save the booster in the current XGBoost native format (UBJ) to eliminate
# the serialization mismatch warning. This makes predictions consistent
# regardless of which XGBoost version originally saved the .pkl.
_ubj_path = BASE / "model_xgboost_v2.ubj"
if not _ubj_path.exists():
    _raw_booster = pipeline.named_steps["xgb"].get_booster()
    _raw_booster.save_model(str(_ubj_path))
    logger.info("Booster re-saved to native UBJ format: %s", _ubj_path.name)

_native_booster = xgb.Booster()
_native_booster.load_model(str(_ubj_path))
logger.info("Native booster loaded from UBJ — predictions will be consistent")

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
logger.info("Distance matrix loaded: %d city pairs, %d cities", len(_distance_lookup), len(CITIES))

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

GMAO_FUEL_MAP: dict[str, str] = {
    "DIESEL":     "Diesel",
    "ESSENCE":    "Petrol",
    "HYBRIDE":    "Diesel",
    "ELECTRIQUE": "Diesel",
    "GPL":        "Petrol",
}

DEFAULT_FUEL_CONSUMPTION: dict[str, float] = {
    "LIGHT_VEHICLE": 7.5,
    "VAN":           11.0,
    "FOURGON":       13.0,
    "HEAVY_TRUCK":   32.0,
}

# Per-km autoroute toll rate (DT/km) — matches training data distribution.
# Flat rate would be out-of-distribution for short trips (e.g. 3.1 km × 0.055 = 0.17 DT,
# not 19.1 DT flat), causing model to return garbage predictions.
TOLL_RATE_PER_KM = 0.055

# Vehicle maintenance + amortization cost per km (TND) — standard Tunisian fleet rates
MAINTENANCE_PER_KM: dict[str, float] = {
    "LIGHT_VEHICLE": 0.18,
    "VAN":           0.28,
    "FOURGON":       0.30,
    "HEAVY_TRUCK":   0.50,
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
    date_depart: str
    vehicle_type_gmao: Optional[str] = None
    vehicle_type: Optional[str] = None
    fuel_type_gmao: Optional[str] = None
    fuel_type: Optional[str] = None
    fuel_consumption_per_100km: Optional[float] = None
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
    logger.info("POST /predict — %s → %s | vehicle_gmao=%s fuel_gmao=%s cons=%.1f autoroute=%s",
                req.departure, req.arrival,
                req.vehicle_type_gmao, req.fuel_type_gmao,
                req.fuel_consumption_per_100km or 0,
                req.has_autoroute)

    key = (req.departure, req.arrival)
    if key not in _distance_lookup:
        logger.warning("Unknown city pair: %s → %s", req.departure, req.arrival)
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

    speed = 75.0
    travel_hours = dist / speed
    fuel_cons = req.fuel_consumption_per_100km or DEFAULT_FUEL_CONSUMPTION.get(vehicle_type, 7.5)
    fuel_price = FUEL_PRICE.get(fuel_type, 1.85)
    driver_allowance = 40.0
    driver_hourly_rate = 8.5

    toll_cost = round(dist * TOLL_RATE_PER_KM, 2) if req.has_autoroute else 0.0
    fuel_cost = dist * fuel_cons / 100.0 * fuel_price
    labor_cost = travel_hours * driver_hourly_rate
    maintenance_cost = dist * MAINTENANCE_PER_KM.get(vehicle_type, 0.18)
    # Cargo surcharge: flat loading/unloading fee (6 DT/ton) + small per-km wear (0.003 DT/ton-km)
    cargo_surcharge = (req.cargo_weight / 1000.0) * (6.0 + dist * 0.003)
    is_long_trip = 1 if dist > 200 else 0
    is_high_traffic = 1 if req.traffic_condition == "Heavy" else 0
    day_iso = dt.isoweekday()
    is_weekend = 1 if day_iso in (6, 7) else 0
    hour = dt.hour
    is_peak_hour = 1 if hour in (7, 8, 9, 16, 17, 18) else 0
    season_ord = SEASON_ORD[dt.month]
    cargo_per_km = req.cargo_weight / dist if dist > 0 else 0.0

    formula_cost = round(fuel_cost + labor_cost + toll_cost + driver_allowance + maintenance_cost + cargo_surcharge, 2)

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

    try:
        # Use the native UBJ booster (re-saved at startup in current XGBoost format).
        # This avoids the serialization mismatch that caused wrong predictions
        # when loading the .pkl with a newer XGBoost version.
        X = pipeline.named_steps["preprocessor"].transform(df)
        ai_predicted = float(_native_booster.predict(xgb.DMatrix(X))[0])
        logger.info("XGBoost prediction: %.2f DT | formula: %.2f DT (fuel=%.2f labor=%.2f maint=%.2f toll=%.2f allow=%.2f cargo=%.2f) | dist=%.1f km vehicle=%s fuel=%s",
                    ai_predicted, formula_cost, fuel_cost, labor_cost, maintenance_cost, toll_cost, driver_allowance, cargo_surcharge, dist, vehicle_type, fuel_type)

        # Fallback to formula if model returns implausible value.
        # Minimum floor = fuel_cost + driver_allowance (bare physical minimum).
        min_plausible = fuel_cost + driver_allowance
        if ai_predicted < min_plausible or ai_predicted > 50_000:
            logger.warning(
                "XGBoost returned implausible value (%.2f, min=%.2f) — using formula fallback",
                ai_predicted, min_plausible)
            predicted = formula_cost
            model_used = "formula-fallback"
        else:
            predicted = round(ai_predicted, 2)
            model_used = "xgboost"
    except Exception as exc:
        logger.error("XGBoost prediction failed: %s — using formula fallback", exc)
        predicted = formula_cost
        model_used = "formula-fallback"

    logger.info("Response: predicted=%.2f DT model=%s", predicted, model_used)

    return {
        "predicted_cost_tnd": predicted,
        "distance_km": dist,
        "travel_hours": round(travel_hours, 2),
        "fuel_cost_tnd": round(fuel_cost, 2),
        "labor_cost_tnd": round(labor_cost, 2),
        "toll_cost_tnd": round(toll_cost, 2),
        "driver_allowance_tnd": driver_allowance,
        "maintenance_cost_tnd": round(maintenance_cost, 2),
        "cargo_surcharge_tnd": round(cargo_surcharge, 2),
        "vehicle_type_used": vehicle_type,
        "fuel_type_used": fuel_type,
        "departure_governorate": info["DepartureGovernorate"],
        "arrival_governorate": info["ArrivalGovernorate"],
        "model_used": model_used,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
