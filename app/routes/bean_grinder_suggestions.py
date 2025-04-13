from fastapi import APIRouter, HTTPException
from app.supabase import supabase
from app.models.bean_grinder_suggestion import BeanGrinderSuggestion, BeanGrinderSuggestionCreate

router = APIRouter(prefix="/bean-grinder-suggestions", tags=["bean-grinder-suggestions"])


# Get all bean-grinder suggestions
@router.get("/", response_model=list[BeanGrinderSuggestion])
def get_bean_grinder_suggestions():
    try:
        response = supabase.table("bean_grinder_suggestion").select("*").execute()
        return [BeanGrinderSuggestion(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a bean-grinder suggestion by ID
@router.get("/{suggestion_id}", response_model=BeanGrinderSuggestion)
def get_bean_grinder_suggestion(suggestion_id: int):
    try:
        response = supabase.table("bean_grinder_suggestion").select("*").eq("id", suggestion_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Bean-grinder suggestion not found")
        return BeanGrinderSuggestion(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get bean-grinder suggestions by bean ID
@router.get("/bean/{bean_id}", response_model=list[BeanGrinderSuggestion])
def get_suggestions_by_bean(bean_id: int):
    try:
        response = supabase.table("bean_grinder_suggestion").select("*").eq("bean_id", bean_id).execute()
        return [BeanGrinderSuggestion(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get bean-grinder suggestions by grinder ID
@router.get("/grinder/{grinder_id}", response_model=list[BeanGrinderSuggestion])
def get_suggestions_by_grinder(grinder_id: int):
    try:
        response = supabase.table("bean_grinder_suggestion").select("*").eq("grinder_id", grinder_id).execute()
        return [BeanGrinderSuggestion(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new bean-grinder suggestion
@router.post("/", response_model=BeanGrinderSuggestion, status_code=201)
def create_bean_grinder_suggestion(suggestion: BeanGrinderSuggestionCreate):
    try:
        response = supabase.table("bean_grinder_suggestion").insert(suggestion.model_dump()).execute()
        return BeanGrinderSuggestion(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update a bean-grinder suggestion by ID
@router.put("/{suggestion_id}", response_model=BeanGrinderSuggestion)
def update_bean_grinder_suggestion(suggestion_id: int, suggestion: BeanGrinderSuggestionCreate):
    try:
        response = (
            supabase.table("bean_grinder_suggestion")
            .update(suggestion.model_dump())
            .eq("id", suggestion_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Bean-grinder suggestion not found")
        return BeanGrinderSuggestion(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a bean-grinder suggestion by ID
@router.delete("/{suggestion_id}", status_code=204)
def delete_bean_grinder_suggestion(suggestion_id: int):
    try:
        response = supabase.table("bean_grinder_suggestion").delete().eq("id", suggestion_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Bean-grinder suggestion not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))