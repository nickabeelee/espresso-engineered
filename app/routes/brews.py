from fastapi import APIRouter, HTTPException
from app.supabase import supabase
from app.models.brew import Brew, BrewCreate
from typing import List

router = APIRouter(prefix="/brews", tags=["brews"])


# Get all brews
@router.get("/", response_model=list[Brew])
def get_brews():
    try:
        response = supabase.table("brew").select("*").execute()
        return [Brew(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a brew by ID
@router.get("/{brew_id}", response_model=Brew)
def get_brew(brew_id: int):
    try:
        response = supabase.table("brew").select("*").eq("id", brew_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Brew not found")
        return Brew(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get brews by barista ID
@router.get("/barista/{barista_id}", response_model=list[Brew])
def get_brews_by_barista(barista_id: int):
    try:
        response = supabase.table("brew").select("*").eq("barista_id", barista_id).execute()
        return [Brew(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get brews by bag ID
@router.get("/bag/{bag_id}", response_model=list[Brew])
def get_brews_by_bag(bag_id: int):
    try:
        response = supabase.table("brew").select("*").eq("bag_id", bag_id).execute()
        return [Brew(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get brews by bean ID
@router.get("/bean/{bean_id}", response_model=list[Brew])
def get_brews_by_bean(bean_id: int):
    try:
        # First get all bags associated with this bean
        bags_response = supabase.table("bag").select("id").eq("bean_id", bean_id).execute()
        
        if not bags_response.data:
            return []
            
        # Extract the bag IDs
        bag_ids = [bag["id"] for bag in bags_response.data]
        
        # Get all brews for these bags
        brews = []
        for bag_id in bag_ids:
            brew_response = supabase.table("brew").select("*").eq("bag_id", bag_id).execute()
            if brew_response.data:
                brews.extend([Brew(**brew) for brew in brew_response.data])
                
        return brews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new brew
@router.post("/", response_model=Brew, status_code=201)
def create_brew(brew: BrewCreate):
    try:
        # Convert the pydantic model to a dict, handling the special yield_ field
        brew_dict = brew.model_dump()
        if "yield_" in brew_dict:
            brew_dict["yield"] = brew_dict.pop("yield_")
            
        response = supabase.table("brew").insert(brew_dict).execute()
        return Brew(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update a brew by ID
@router.put("/{brew_id}", response_model=Brew)
def update_brew(brew_id: int, brew: BrewCreate):
    try:
        # Convert the pydantic model to a dict, handling the special yield_ field
        brew_dict = brew.model_dump()
        if "yield_" in brew_dict:
            brew_dict["yield"] = brew_dict.pop("yield_")
            
        response = (
            supabase.table("brew")
            .update(brew_dict)
            .eq("id", brew_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Brew not found")
        return Brew(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a brew by ID
@router.delete("/{brew_id}", status_code=204)
def delete_brew(brew_id: int):
    try:
        response = supabase.table("brew").delete().eq("id", brew_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Brew not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))