from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes import (
    roasters,
    beans,
    machines,
    baristas,
    bags,
    grinders,
    bean_grinder_suggestions,
    bag_grinder_suggestions,
    brews,
)

load_dotenv()  # Load the .env variables

app = FastAPI()

# Configure CORS middleware
origins = [
    "http://localhost:5173",  # Vite default dev server
    "http://127.0.0.1:5173",
    "http://localhost:3000",   # Common React port
    "http://127.0.0.1:3000",
    "http://localhost:8080",   # Another common dev port
    "http://127.0.0.1:8080",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the routers
app.include_router(roasters.router)
app.include_router(beans.router)
app.include_router(machines.router)
app.include_router(baristas.router)
app.include_router(bags.router)
app.include_router(grinders.router)
app.include_router(bean_grinder_suggestions.router)
app.include_router(bag_grinder_suggestions.router)
app.include_router(brews.router)
