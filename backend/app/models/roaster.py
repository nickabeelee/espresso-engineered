from pydantic import BaseModel


class Roaster(BaseModel):
    id: int
    name: str


class RoasterCreate(BaseModel):
    name: str
