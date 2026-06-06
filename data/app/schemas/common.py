"""Shared response models for nba_api pass-through JSON."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, RootModel


class NBARecord(BaseModel):
    """One row from an nba_api dataframe; column set varies by endpoint."""

    model_config = ConfigDict(extra="allow")


class RecordsResponse(BaseModel):
    records: list[NBARecord] = Field(default_factory=list)


class PlayersIndexResponse(BaseModel):
    player_index: list[NBARecord] = Field(default_factory=list)
    common_all_players: list[NBARecord] = Field(default_factory=list)


class NBAJsonResponse(RootModel[dict[str, Any]]):
    """Arbitrary JSON object from nba_api (splits, compare, depth, etc.)."""


def validate_json_object(data: dict[str, Any]) -> dict[str, Any]:
    """Ensure top-level JSON object; allow any keys from upstream."""
    NBAJsonResponse.model_validate(data)
    return data

