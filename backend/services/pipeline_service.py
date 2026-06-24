import time
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

from ..schemas.research_schema import ProgressStep, ResearchResponse
from .pipeline_adapter import ReportMode, generate_report_router

load_dotenv()


STEP_LABELS = [
    "Query Planner Agent",
    "PDF Retriever Agent",
    "Web Search Agent",
    "Analyzer Agent",
    "Report Writer Agent",
    "Citation Checker Agent",
    "Completed",
]


def _build_progress(status: str, failed_at: Optional[int] = None) -> List[ProgressStep]:
    steps: List[ProgressStep] = []

    for index, label in enumerate(STEP_LABELS, start=1):
        if status == "completed":
            step_status = "completed"
        elif failed_at is not None:
            step_status = "failed" if index == failed_at else "completed" if index < failed_at else "pending"
        else:
            step_status = "pending"

        steps.append(
            ProgressStep(
                id=index,
                label=label,
                status=step_status,
                message=_message_for_step(label, step_status),
            )
        )

    return steps


def _message_for_step(label: str, status: str) -> str:
    messages = {
        "Query Planner Agent": "The router selected the right research workflow.",
        "PDF Retriever Agent": "Relevant PDF chunks were retrieved when a document was provided.",
        "Web Search Agent": "The existing Tavily and BeautifulSoup pipeline ran when web research was needed.",
        "Analyzer Agent": "Retrieved evidence was organized before writing.",
        "Report Writer Agent": "A grounded report was generated from the selected context.",
        "Citation Checker Agent": "PDF sources were attached and checked for traceability.",
        "Completed": "The research report is ready.",
    }

    if status == "failed":
        return f"{label} did not complete successfully."

    return messages.get(label, status)


def _stringify(value: Any) -> Optional[str]:
    if value is None:
        return None
    return value if isinstance(value, str) else str(value)


def generate_research_report(
    topic: str,
    mode: ReportMode = "web",
    document_id: Optional[str] = None,
) -> ResearchResponse:
    start_time = time.perf_counter()
    clean_topic = topic.strip()

    try:
        state: Dict[str, Any] = generate_report_router(
            query=clean_topic,
            mode=mode,
            document_id=document_id,
        )
        elapsed_seconds = round(time.perf_counter() - start_time, 2)

        return ResearchResponse(
            success=True,
            topic=clean_topic,
            mode=mode,
            document_id=document_id,
            final_report=_stringify(state.get("report")),
            feedback=_stringify(state.get("feedback")),
            sources=state.get("sources", []),
            progress=_build_progress("completed"),
            metadata={
                **state.get("metadata", {}),
                "elapsed_seconds": elapsed_seconds,
            },
        )
    except Exception as exc:
        elapsed_seconds = round(time.perf_counter() - start_time, 2)

        return ResearchResponse(
            success=False,
            topic=clean_topic,
            mode=mode,
            document_id=document_id,
            final_report=None,
            feedback=None,
            sources=[],
            progress=_build_progress("failed", failed_at=3),
            error=str(exc),
            metadata={"elapsed_seconds": elapsed_seconds},
        )
