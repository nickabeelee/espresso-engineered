from dotenv import load_dotenv
import os

# This will load variables from a .env file into the environment
load_dotenv()

url = os.getenv("SUPABASE_URL")
if url is None:
    raise ValueError("Environment variable SUPABASE_URL must be set and not None")
SUPABASE_URL: str = url

key = os.getenv("SUPABASE_KEY")
if key is None:
    raise ValueError("Environment variable SUPABASE_KEY must be set and not None")
SUPABASE_KEY: str = key

APP_PORT = os.getenv("APP_PORT", 8000)
DEBUG = os.getenv("DEBUG", "False") == "True"
