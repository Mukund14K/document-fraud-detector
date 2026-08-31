from pydantic import BaseModel
from typing import List, Optional, Any


class CheckResult(BaseModel):
    name: str
    passed: Any
    detail: Optional[Any] = None
    heatmap_path: Optional[str] = None


class AnalyzeResponse(BaseModel):
    verdict: str
    risk_score: float
    checks: List[CheckResult]
