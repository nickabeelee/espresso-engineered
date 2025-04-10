from fastapi import APIRouter, HTTPException
from app.supabase import supabase

router = APIRouter()


@router.get("/roasters")
async def get_roasters():
    try:
        response = supabase.table("roaster").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
