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
    document_filename: Optional[str] = None
    document_path: Optional[str] = None
    pdf_report_path: Optional[str] = None
    checks: List[CheckResult]

