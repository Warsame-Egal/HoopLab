import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pythonjsonlogger import jsonlogger

from app.errors import register_exception_handlers
from app.middleware import RejectWebSocketUpgradeMiddleware, ResponseCacheMiddleware
from app.routers.compare import router as compare_router
from app.routers.fetch import router as fetch_router
from app.routers.games import router as games_router
from app.routers.health import router as health_router
from app.routers.league import router as league_router
from app.routers.live import router as live_router
from app.routers.player import router as player_router
from app.routers.team import router as team_router

logger = logging.getLogger(__name__)


def setup_logging() -> None:
    root = logging.getLogger()
    for handler in root.handlers[:]:
        root.removeHandler(handler)
    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)
    root.addHandler(handler)
    root.setLevel(logging.INFO)


setup_logging()

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

app = FastAPI(
    title="HoopLab Data API",
    description=(
        "NBA data service for HoopLab. Wraps swar/nba_api with rate limiting and live endpoints. "
        "Called by the Spring Boot API."
    ),
    version="1.0.0",
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080")
allowed_origins = [origin.strip() for origin in _raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ResponseCacheMiddleware)
app.add_middleware(RejectWebSocketUpgradeMiddleware)


@app.get("/")
def home():
    return {"message": "HoopLab data service is running"}


app.include_router(fetch_router)
app.include_router(league_router)
app.include_router(player_router)
app.include_router(team_router)
app.include_router(compare_router)
app.include_router(games_router)
app.include_router(health_router)
app.include_router(live_router)

register_exception_handlers(app)
