from enum import Enum


class RoastLevel(str, Enum):
    DARK = "Dark"
    MEDIUM_DARK = "Medium Dark"
    MEDIUM = "Medium"
    MEDIUM_LIGHT = "Medium Light"
    LIGHT = "Light"
