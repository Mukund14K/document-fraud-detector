"""
API Router for document analysis history.
Endpoints:
- GET /history : List all analyzed document history records
- DELETE /history/{item_id} : Remove a single record
- DELETE /history : Clear all records
"""

from fastapi import APIRouter
from typing import List, Dict, Any
from app.utils.history_manager import (
    get_all_history,
    delete_history_entry,
    clear_all_history,
)

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_history():
    """Retrieve full analysis history from backend."""
    return get_all_history()


@router.delete("/{item_id}", response_model=List[Dict[str, Any]])
async def delete_history_item(item_id: str):
    """Delete a specific history item by ID."""
    return delete_history_entry(item_id)


@router.delete("")
async def clear_history():
    """Clear all analysis history."""
    clear_all_history()
    return {"message": "History cleared successfully"}
