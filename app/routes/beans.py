from fastapi import APIRouter, HTTPException
from app.supabase import supabase
from app.models.bean import Bean, BeanCreate

router = APIRouter(prefix="/beans", tags=["beans"])


# Get all beans
@router.get("/", response_model=list[Bean])
def get_beans():
    try:
        response = supabase.table("bean").select("*").execute()
        return [Bean(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a bean by ID
@router.get("/{bean_id}", response_model=Bean)
def get_bean(bean_id: int):
    try:
        response = supabase.table("bean").select("*").eq("id", bean_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Bean not found")
        return Bean(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new bean
@router.post("/", response_model=Bean, status_code=201)
def create_bean(bean: BeanCreate):
    try:
        response = supabase.table("bean").insert(bean.model_dump()).execute()
        return Bean(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update a bean by ID
@router.put("/{bean_id}", response_model=Bean)
def update_bean(bean_id: int, bean: BeanCreate):
    try:
        response = (
            supabase.table("bean").update(bean.model_dump()).eq("id", bean_id).execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Bean not found")
        return Bean(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a bean by ID
@router.delete("/{bean_id}", status_code=204)
def delete_bean(bean_id: int):
    try:
        response = supabase.table("bean").delete().eq("id", bean_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Bean not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
