from pydantic import BaseModel
from typing import Optional


class Grinder(BaseModel):
    id: int
    name: str
    user_manual_link: Optional[str]
    image: Optional[str]
    setting_guide_chart: Optional[str]


class GrinderCreate(BaseModel):
    name: str
    user_manual_link: Optional[str] = None
    image: Optional[str] = None
    setting_guide_chart: Optional[str] = None
