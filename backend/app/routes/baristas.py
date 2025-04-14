from fastapi import APIRouter, HTTPException
from app.supabase import supabase
from app.models.barista import Barista, BaristaCreate

router = APIRouter(prefix="/baristas", tags=["baristas"])


# Get all baristas
@router.get("/", response_model=list[Barista])
def get_baristas():
    try:
        response = supabase.table("barista").select("*").execute()
        return [Barista(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a barista by ID
@router.get("/{barista_id}", response_model=Barista)
def get_barista(barista_id: int):
    try:
        response = supabase.table("barista").select("*").eq("id", barista_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Barista not found")
        return Barista(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new barista
@router.post("/", response_model=Barista, status_code=201)
def create_barista(barista: BaristaCreate):
    try:
        response = supabase.table("barista").insert(barista.model_dump()).execute()
        return Barista(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update a barista by ID
@router.put("/{barista_id}", response_model=Barista)
def update_barista(barista_id: int, barista: BaristaCreate):
    try:
        response = (
            supabase.table("barista")
            .update(barista.model_dump())
            .eq("id", barista_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Barista not found")
        return Barista(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a barista by ID
@router.delete("/{barista_id}", status_code=204)
def delete_barista(barista_id: int):
    try:
        response = supabase.table("barista").delete().eq("id", barista_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Barista not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))