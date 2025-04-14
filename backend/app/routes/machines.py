from fastapi import APIRouter, HTTPException
from app.supabase import supabase
from app.models.machine import Machine, MachineCreate

router = APIRouter(prefix="/machines", tags=["machines"])


# Get all machines
@router.get("/", response_model=list[Machine])
def get_machines():
    try:
        response = supabase.table("machine").select("*").execute()
        return [Machine(**r) for r in response.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get a machine by ID
@router.get("/{machine_id}", response_model=Machine)
def get_machine(machine_id: int):
    try:
        response = supabase.table("machine").select("*").eq("id", machine_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Machine not found")
        return Machine(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Create a new machine
@router.post("/", response_model=Machine, status_code=201)
def create_machine(machine: MachineCreate):
    try:
        response = supabase.table("machine").insert(machine.model_dump()).execute()
        return Machine(**response.data[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Update a machine by ID
@router.put("/{machine_id}", response_model=Machine)
def update_machine(machine_id: int, machine: MachineCreate):
    try:
        response = (
            supabase.table("machine")
            .update(machine.model_dump())
            .eq("id", machine_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Machine not found")
        return Machine(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Delete a machine by ID
@router.delete("/{machine_id}", status_code=204)
def delete_machine(machine_id: int):
    try:
        response = supabase.table("machine").delete().eq("id", machine_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Machine not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))