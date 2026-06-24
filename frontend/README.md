# Multi-Agent Research Report Frontend

React UI for generating Web Research, PDF RAG, and Hybrid reports.

## Setup

```powershell
cd frontend
npm install
```

## Run

```powershell
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

If that port is busy:

```powershell
npm run dev -- --host 127.0.0.1 --port 5181 --strictPort
```

## Backend Connection

Default API base URL:

```text
http://127.0.0.1:8000
```

Override with `frontend/.env`:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## PDF Flow

1. Select `PDF RAG` or `Hybrid`.
2. Choose a PDF file.
3. Click `Upload PDF`.
4. Enter a topic.
5. Click `Generate Report`.

The frontend first calls `/api/research/upload-pdf`, then calls `/api/research/generate` with the returned `document_id`.
