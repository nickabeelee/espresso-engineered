from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BeanGrinderSuggestion(BaseModel):
    id: int
    grinder_id: int
    bean_id: int
    suggestion: Optional[float]
    friendly_suggestion: Optional[str]
    suggestion_method: Optional[str]
    generation_timestamp: Optional[datetime]


class BeanGrinderSuggestionCreate(BaseModel):
    grinder_id: int
    bean_id: int
    suggestion: Optional[float] = None
    friendly_suggestion: Optional[str] = None
    suggestion_method: Optional[str] = None
    generation_timestamp: Optional[datetime] = None
