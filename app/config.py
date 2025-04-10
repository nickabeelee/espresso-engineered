from dotenv import load_dotenv
import os

# This will load variables from a .env file into the environment
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
APP_PORT = os.getenv("APP_PORT", 8000)
DEBUG = os.getenv("DEBUG", "False") == "True"
