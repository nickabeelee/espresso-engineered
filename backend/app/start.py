import os
import uvicorn
from dotenv import load_dotenv


def run():
    load_dotenv()  # loads from .env if not already loaded.

    port = int(os.getenv("APP_PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
