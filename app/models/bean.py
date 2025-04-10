from pydantic import BaseModel
from typing import Optional
from app.enums import RoastLevel


class Bean(BaseModel):
    id: int
    name: str
    roaster_id: int
    roast_level: RoastLevel
    country_of_origin: Optional[str]
    tasting_notes: Optional[str]
    rating: Optional[int]


class BeanCreate(BaseModel):
    name: str
    roaster_id: int
    roast_level: RoastLevel
    country_of_origin: Optional[str] = None
    tasting_notes: Optional[str] = None
    rating: Optional[int] = None
