import logging
from typing import Any, Coroutine, TypeVar

from fastapi import HTTPException

from app.schemas.common import (
    PlayersIndexResponse,
    RecordsResponse,
    validate_json_object,
)

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=dict[str, Any])


async def wrap_json(coro: Coroutine[Any, Any, T]) -> T:
    try:
        data = await coro
        validate_json_object(data)
        return data
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Upstream fetch failed")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


async def wrap_players(coro: Coroutine[Any, Any, T]) -> T:
    try:
        data = await coro
        PlayersIndexResponse.model_validate(data)
        return data
    except Exception as exc:
        logger.exception("Upstream fetch failed")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


async def wrap_records(coro: Coroutine[Any, Any, T]) -> T:
    try:
        data = await coro
        RecordsResponse.model_validate(data)
        return data
    except Exception as exc:
        logger.exception("Upstream fetch failed")
        raise HTTPException(status_code=502, detail=str(exc)) from exc


# FastAPI response_model: RootModel serializes as the root dict in OpenAPI/JSON
JsonModel = dict[str, Any]
RecordsModel = RecordsResponse
PlayersModel = PlayersIndexResponse
