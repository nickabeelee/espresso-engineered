from fastapi import APIRouter, HTTPException
from app.supabase import supabase
from app.models.grinder import Grinder, GrinderCreate

router = APIRouter(prefix="/grinders", tags=["grinders"])


# Get all grinders
@router.get("/", response_model=list[Grinder])
def get_grinders():
    try:
        response = supabase.table("grinder").select("*").execute()
        return [Grinder(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a grinder by ID
@router.get("/{grinder_id}", response_model=Grinder)
def get_grinder(grinder_id: int):
    try:
        response = supabase.table("grinder").select("*").eq("id", grinder_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Grinder not found")
        return Grinder(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new grinder
@router.post("/", response_model=Grinder, status_code=201)
def create_grinder(grinder: GrinderCreate):
    try:
        response = supabase.table("grinder").insert(grinder.model_dump()).execute()
        return Grinder(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update a grinder by ID
@router.put("/{grinder_id}", response_model=Grinder)
def update_grinder(grinder_id: int, grinder: GrinderCreate):
    try:
        response = (
            supabase.table("grinder")
            .update(grinder.model_dump())
            .eq("id", grinder_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Grinder not found")
        return Grinder(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a grinder by ID
@router.delete("/{grinder_id}", status_code=204)
def delete_grinder(grinder_id: int):
    try:
        response = supabase.table("grinder").delete().eq("id", grinder_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Grinder not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))