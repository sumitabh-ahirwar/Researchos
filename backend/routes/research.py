from fastapi import APIRouter, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from ..schemas.research_schema import PdfUploadResponse, ResearchRequest, ResearchResponse
from ..services.pipeline_service import generate_research_report
from ..services.rag_service import save_and_ingest_pdf

router = APIRouter()


@router.post("/generate", response_model=ResearchResponse)
async def generate_report(payload: ResearchRequest) -> ResearchResponse:
    """
    Run the existing research pipeline for a user-supplied topic.

    The pipeline is synchronous, so it runs in a threadpool to avoid blocking
    FastAPI's event loop while the agents search, scrape, and write.
    """
    return await run_in_threadpool(
        generate_research_report,
        payload.topic,
        payload.mode,
        payload.document_id,
    )


@router.post("/upload-pdf", response_model=PdfUploadResponse)
async def upload_pdf(file: UploadFile = File(...)) -> PdfUploadResponse:
    """
    Upload and index a PDF before generating PDF RAG or Hybrid reports.
    """
    filename = file.filename or "uploaded.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")

        result = await run_in_threadpool(save_and_ingest_pdf, file_bytes, filename)
        return PdfUploadResponse(
            success=True,
            document_id=result["document_id"],
            filename=result["filename"],
            pages=result["pages"],
            chunks=result["chunks"],
            message=result["message"],
        )
    except HTTPException:
        raise
    except Exception as exc:
        return PdfUploadResponse(
            success=False,
            message="PDF upload failed.",
            error=str(exc),
        )
