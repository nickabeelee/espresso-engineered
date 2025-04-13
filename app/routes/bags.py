from fastapi import APIRouter, HTTPException
from app.supabase import supabase
from app.models.bag import Bag, BagCreate

router = APIRouter(prefix="/bags", tags=["bags"])


# Get all bags
@router.get("/", response_model=list[Bag])
def get_bags():
    try:
        response = supabase.table("bag").select("*").execute()
        return [Bag(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a bag by ID
@router.get("/{bag_id}", response_model=Bag)
def get_bag(bag_id: int):
    try:
        response = supabase.table("bag").select("*").eq("id", bag_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Bag not found")
        return Bag(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new bag
@router.post("/", response_model=Bag, status_code=201)
def create_bag(bag: BagCreate):
    try:
        response = supabase.table("bag").insert(bag.model_dump()).execute()
        return Bag(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update a bag by ID
@router.put("/{bag_id}", response_model=Bag)
def update_bag(bag_id: int, bag: BagCreate):
    try:
        response = (
            supabase.table("bag")
            .update(bag.model_dump())
            .eq("id", bag_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Bag not found")
        return Bag(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a bag by ID
@router.delete("/{bag_id}", status_code=204)
def delete_bag(bag_id: int):
    try:
        response = supabase.table("bag").delete().eq("id", bag_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Bag not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))