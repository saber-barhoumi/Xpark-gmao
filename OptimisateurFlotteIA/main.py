"""OptimisateurFlotteIA — moteur d'optimisation d'affectation flotte/chauffeurs.

FastAPI service (port 8000 in container, 8001 on host) following the same
integration pattern as CalculateurPrixTrajetIA: the backoffice gathers the
pending missions + available resources from the microservices and posts a
self-contained payload; the optimizer returns an explainable assignment plan.
"""

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import OptimizeRequest, OptimizeResponse
from optimizer import optimize
from rabbitmq_consumer import start_consumer_thread

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("fleet-optimizer")

app = FastAPI(title="XparkGMAO — OptimisateurFlotteIA", version="1.1")


@app.on_event("startup")
def startup():
    # Event-driven mode (FICHE §2.3) — consumes xpark.missions.ready-for-optimization
    # and publishes xpark.optimization.plan-generated. The HTTP POST /optimize
    # endpoint stays available for Swagger testing and direct calls.
    start_consumer_thread()
    logger.info("RabbitMQ consumer thread started (event-driven mode)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "OptimisateurFlotteIA",
            "algorithm": "GREEDY+GA+LOCAL_SEARCH v1.0"}


@app.post("/optimize", response_model=OptimizeResponse)
def run_optimization(req: OptimizeRequest):
    logger.info("POST /optimize — batch=%s | %d missions, %d vehicules, %d chauffeurs, %d historiques",
                req.batchId or "-", len(req.missions), len(req.vehicles),
                len(req.drivers), len(req.recentMissions))

    if not req.missions:
        raise HTTPException(status_code=422, detail="Aucune mission à optimiser.")
    if not req.vehicles:
        raise HTTPException(status_code=422, detail="Aucun véhicule disponible.")
    if not req.drivers:
        raise HTTPException(status_code=422, detail="Aucun chauffeur disponible.")

    try:
        return optimize(req)
    except Exception as exc:  # graceful degradation (FICHE §9.3)
        logger.exception("Optimization failed")
        raise HTTPException(status_code=500, detail=f"Echec de l'optimisation: {exc}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
