from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Brew(BaseModel):
    id: int
    name: str
    machine_id: int
    bag_id: int
    grinder_id: int
    barista_id: int
    brew_time: Optional[float]
    timestamp: Optional[datetime]
    dose: Optional[float]
    yield_: Optional[float]
    rating: Optional[int]
    tasting_notes: Optional[str]
    reflections: Optional[str]

    class Config:
        fields = {"yield_": "yield"}


class BrewCreate(BaseModel):
    name: str
    machine_id: int
    bag_id: int
    grinder_id: int
    barista_id: int
    brew_time: Optional[float] = None
    timestamp: Optional[datetime] = None
    dose: Optional[float] = None
    yield_: Optional[float] = None
    rating: Optional[int] = None
    tasting_notes: Optional[str] = None
    reflections: Optional[str] = None

    class Config:
        fields = {"yield_": "yield"}
