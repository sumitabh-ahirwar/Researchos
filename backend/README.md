# Multi-Agent Research Report Backend

FastAPI backend for Web Research, PDF RAG, and Hybrid report generation.

## Modes

- `web`: uses the existing `backend/pipeline.py` flow with Tavily and BeautifulSoup.
- `pdf`: retrieves relevant chunks from an uploaded PDF and generates a grounded report.
- `hybrid`: retrieves PDF chunks, runs the web pipeline, then merges both contexts.

## Setup

From the project root:

```powershell
.\.venv\Scripts\activate
pip install -r backend\requirements.txt
```

Keep API keys in the project `.env` file.

## Run

```powershell
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Docs:

```text
http://127.0.0.1:8000/docs
```

## Upload PDF

```http
POST /api/research/upload-pdf
Content-Type: multipart/form-data
```

Response includes `document_id`, `pages`, and `chunks`.

## Generate Report

```http
POST /api/research/generate
Content-Type: application/json

{
  "topic": "Summarize the financial risks in the uploaded PDF",
  "mode": "pdf",
  "document_id": "returned-document-id"
}
```

For normal web reports:

```json
{
  "topic": "Latest trends in agentic AI systems",
  "mode": "web"
}
```

## Integration Points

- Existing web pipeline remains in `backend/pipeline.py`.
- PDF indexing and retrieval live in `backend/services/rag_service.py`.
- Mode routing lives in `backend/services/pipeline_adapter.py`.
- FastAPI routes live in `backend/routes/research.py`.
