from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

StepStatus = Literal["pending", "running", "completed", "failed"]
ReportMode = Literal["web", "pdf", "hybrid"]


class ResearchRequest(BaseModel):
    topic: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Research topic or question entered by the user.",
        examples=["Impact of agentic AI systems on software engineering"],
    )
    mode: ReportMode = Field(
        default="web",
        description="Report mode: web, pdf, or hybrid.",
    )
    document_id: Optional[str] = Field(
        default=None,
        description="Uploaded PDF document id required for pdf and hybrid modes.",
    )


class ProgressStep(BaseModel):
    id: int
    label: str
    status: StepStatus
    message: Optional[str] = None


class ResearchResponse(BaseModel):
    success: bool
    topic: str
    mode: ReportMode = "web"
    document_id: Optional[str] = None
    final_report: Optional[str] = None
    feedback: Optional[str] = None
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    progress: List[ProgressStep]
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PdfUploadResponse(BaseModel):
    success: bool
    document_id: Optional[str] = None
    filename: Optional[str] = None
    pages: int = 0
    chunks: int = 0
    message: str
    error: Optional[str] = None
