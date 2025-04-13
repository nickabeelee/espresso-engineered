from fastapi import APIRouter, HTTPException
from app.supabase import supabase
from app.models.bag_grinder_suggestion import BagGrinderSuggestion, BagGrinderSuggestionCreate

router = APIRouter(prefix="/bag-grinder-suggestions", tags=["bag-grinder-suggestions"])


# Get all bag-grinder suggestions
@router.get("/", response_model=list[BagGrinderSuggestion])
def get_bag_grinder_suggestions():
    try:
        response = supabase.table("bag_grinder_suggestion").select("*").execute()
        return [BagGrinderSuggestion(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a bag-grinder suggestion by ID
@router.get("/{suggestion_id}", response_model=BagGrinderSuggestion)
def get_bag_grinder_suggestion(suggestion_id: int):
    try:
        response = supabase.table("bag_grinder_suggestion").select("*").eq("id", suggestion_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Bag-grinder suggestion not found")
        return BagGrinderSuggestion(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get bag-grinder suggestions by bag ID
@router.get("/bag/{bag_id}", response_model=list[BagGrinderSuggestion])
def get_suggestions_by_bag(bag_id: int):
    try:
        response = supabase.table("bag_grinder_suggestion").select("*").eq("bag_id", bag_id).execute()
        return [BagGrinderSuggestion(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get bag-grinder suggestions by grinder ID
@router.get("/grinder/{grinder_id}", response_model=list[BagGrinderSuggestion])
def get_suggestions_by_grinder(grinder_id: int):
    try:
        response = supabase.table("bag_grinder_suggestion").select("*").eq("grinder_id", grinder_id).execute()
        return [BagGrinderSuggestion(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new bag-grinder suggestion
@router.post("/", response_model=BagGrinderSuggestion, status_code=201)
def create_bag_grinder_suggestion(suggestion: BagGrinderSuggestionCreate):
    try:
        response = supabase.table("bag_grinder_suggestion").insert(suggestion.model_dump()).execute()
        return BagGrinderSuggestion(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update a bag-grinder suggestion by ID
@router.put("/{suggestion_id}", response_model=BagGrinderSuggestion)
def update_bag_grinder_suggestion(suggestion_id: int, suggestion: BagGrinderSuggestionCreate):
    try:
        response = (
            supabase.table("bag_grinder_suggestion")
            .update(suggestion.model_dump())
            .eq("id", suggestion_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Bag-grinder suggestion not found")
        return BagGrinderSuggestion(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a bag-grinder suggestion by ID
@router.delete("/{suggestion_id}", status_code=204)
def delete_bag_grinder_suggestion(suggestion_id: int):
    try:
        response = supabase.table("bag_grinder_suggestion").delete().eq("id", suggestion_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Bag-grinder suggestion not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))