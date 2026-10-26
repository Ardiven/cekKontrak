from fastapi import APIRouter
from backend.app.services.sample_contracts import SAMPLE_CONTRACTS

router = APIRouter()


@router.get("/samples")
def get_sample_contracts():
    """Returns sample contracts for 1-click quick testing."""
    return SAMPLE_CONTRACTS
