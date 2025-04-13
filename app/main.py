from fastapi import FastAPI
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
