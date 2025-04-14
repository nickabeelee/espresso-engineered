from fastapi import APIRouter, HTTPException
from app.supabase import supabase
from app.models.roaster import Roaster, RoasterCreate

router = APIRouter(prefix="/roasters", tags=["roasters"])


# Get all roasters
@router.get("/", response_model=list[Roaster])
async def get_roasters():
    try:
        response = supabase.table("roaster").select("*").execute()
        return [Roaster(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a single roaster by ID
@router.get("/{roaster_id}", response_model=Roaster)
def get_roaster(roaster_id: int):
    try:
        response = supabase.table("roaster").select("*").eq("id", roaster_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Roaster not found")
        return Roaster(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new roaster
@router.post("/", response_model=Roaster, status_code=201)
def create_roaster(roaster: RoasterCreate):
    try:
        response = supabase.table("roaster").insert(roaster.model_dump()).execute()
        return Roaster(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update an existing roaster
@router.put("/{roaster_id}", response_model=Roaster)
def update_roaster(roaster_id: int, roaster: RoasterCreate):
    try:
        response = (
            supabase.table("roaster")
            .update(roaster.model_dump())
            .eq("id", roaster_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Roaster not found")
        return Roaster(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a roaster
@router.delete("/{roaster_id}", status_code=204)
def delete_roaster(roaster_id: int):
    try:
        response = supabase.table("roaster").delete().eq("id", roaster_id).execute()
        return None
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="Roaster not found or delete failed."
        )
