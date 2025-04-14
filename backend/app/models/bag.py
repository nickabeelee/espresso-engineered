from pydantic import BaseModel
from typing import Optional
from datetime import date


class Bag(BaseModel):
    id: int
    name: str
    bean_id: int
    roast_date: Optional[date]
    weight: Optional[float]
    price: Optional[float]
    purchase_location: Optional[str]
    rating: Optional[int]


class BagCreate(BaseModel):
    name: str
    bean_id: int
    roast_date: Optional[date] = None
    weight: Optional[float] = None
    price: Optional[float] = None
    purchase_location: Optional[str] = None
    rating: Optional[int] = None
