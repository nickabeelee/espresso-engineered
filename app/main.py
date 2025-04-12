from fastapi import FastAPI
from dotenv import load_dotenv
from app.routes import roasters, beans

load_dotenv()  # Load the .env variables

app = FastAPI()

# Register the routers
app.include_router(roasters.router)
app.include_router(beans.router)
