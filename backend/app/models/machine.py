from pydantic import BaseModel, HttpUrl
from typing import Optional


class Machine(BaseModel):
    id: int
    name: str
    manufacturer: Optional[str]
    user_manual_link: Optional[HttpUrl]
    image: Optional[str]  # Use URL or path string


class MachineCreate(BaseModel):
    name: str
    manufacturer: Optional[str] = None
    user_manual_link: Optional[HttpUrl] = None
    image: Optional[str] = None
