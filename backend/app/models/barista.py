from pydantic import BaseModel, EmailStr


class Barista(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr


class BaristaCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
