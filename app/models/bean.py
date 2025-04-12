from pydantic import BaseModel, Field
from typing import Optional
from app.enums import RoastLevel


class Bean(BaseModel):
    id: int
    name: str
    roaster_id: int
    roast_level: RoastLevel
    country_of_origin: Optional[str]
    tasting_notes: Optional[str]
    rating: Optional[int] = Field(
        None, ge=0, le=5
    )  # enforces value between 0 and 5 inclusive


class BeanCreate(BaseModel):
    name: str
    roaster_id: int
    roast_level: RoastLevel
    country_of_origin: Optional[str] = None
    tasting_notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=0, le=5)
