# ResearchOS

A multi-agent research workspace. You give it a question; a pipeline of specialised
agents plans the work, gathers evidence from the live web and/or your own PDFs,
analyses it, writes a structured report, and attaches citations.

Three research modes:

| Mode | Evidence source | Needs an uploaded PDF |
|---|---|---|
| **Web** | Live search + page scraping | No |
| **PDF** | Retrieval over your uploaded document (RAG) | Yes |
| **Hybrid** | Both, merged into one context | Yes |

**Stack:** FastAPI · LangChain · Mistral · Tavily · ChromaDB · MongoDB Atlas ·
React 18 · Vite

---

## Table of contents

- [Quick start](#quick-start)
- [How a request flows](#how-a-request-flows)
- [The agent system](#the-agent-system) ← *start here to understand the project*
- [Mode-by-mode walkthrough](#mode-by-mode-walkthrough)
- [The RAG subsystem](#the-rag-subsystem)
- [Progress reporting (and why it lies)](#progress-reporting-and-why-it-lies)
- [Authentication](#authentication)
- [Frontend architecture](#frontend-architecture)
- [API reference](#api-reference)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Known limitations and gotchas](#known-limitations-and-gotchas)
- [A suggested reading order](#a-suggested-reading-order)

---

## Quick start

**Prerequisites:** Python 3.12, Node 18+, a Tavily API key, a Mistral API key,
and a MongoDB connection string.

Create `.env` in the project root:

```text
TAVILY_API_KEY="your_tavily_key"
MISTRAL_API_KEY="your_mistral_key"
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/Researchos"
JWT_SECRET="a_long_random_string"
JWT_EXPIRE_MINUTES=10080
```

Backend:

```bash
pip install -r backend/requirements.txt
```

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend, in a second terminal:

```bash
cd frontend && npm install && npm run dev
```

Open <http://127.0.0.1:5173>. API docs are at <http://127.0.0.1:8000/docs>.

> **Use `127.0.0.1`, not `localhost`.** The session cookie is bound to the API's
> host. Opening the frontend on `localhost` while the API is on `127.0.0.1`
> means the browser won't send the cookie back and you'll appear permanently
> signed out.

---

## How a request flows

```mermaid
flowchart TB
    U[Browser] -->|POST /api/research/generate| R[routes/research.py]
    R -->|run_in_threadpool| S[services/pipeline_service.py]
    S --> A[services/pipeline_adapter.py<br/>generate_report_router]
    A -->|mode=web| W[pipeline.py<br/>run_pipeline]
    A -->|mode=pdf| P[services/rag_service.py<br/>retrieve_pdf_context]
    A -->|mode=hybrid| W
    A -->|mode=hybrid| P
    W --> O[Report + critique]
    P --> O
    O -->|+ synthesized progress| U
```

The one structural detail worth internalising early: **the whole pipeline is
synchronous**. `run_in_threadpool` at [`routes/research.py:19`](backend/routes/research.py)
pushes it off the event loop so FastAPI can still serve other requests, but a
single research call blocks its own thread from start to finish and returns
everything at once. There is no streaming, no websocket, no polling endpoint.
That single fact explains most of the design decisions downstream — including
why the progress tracker works the way it does.

---

## The agent system

This is the heart of the project, and the part most worth understanding.

### Nine "agents", two very different kinds

The system advertises nine named agents. Five make real LLM calls. Four are
plain Python functions that were given agent names because they occupy a slot
in the conceptual pipeline. Knowing which is which will save you a lot of
confusion:

| # | Name | Kind | Defined in |
|---|---|---|---|
| 1 | Search Agent | **Agentic loop** (tool-calling) | [`agents.py:19`](backend/agents.py) |
| 2 | Reader Agent | **Agentic loop** (tool-calling) | [`agents.py:26`](backend/agents.py) |
| 3 | Writer Chain | **LLM chain** | [`agents.py:51`](backend/agents.py) |
| 4 | Critic Chain | **LLM chain** | [`agents.py:76`](backend/agents.py) |
| 5 | Report Writer Chain | **LLM chain** | [`pipeline_adapter.py:59`](backend/services/pipeline_adapter.py) |
| 6 | Query Planner Agent | Plain function — string formatting | [`pipeline_adapter.py:62`](backend/services/pipeline_adapter.py) |
| 7 | PDF Retriever Agent | Plain function — vector search | [`pipeline_adapter.py:75`](backend/services/pipeline_adapter.py) |
| 8 | Analyzer Agent | Plain function — string concatenation | [`pipeline_adapter.py:83`](backend/services/pipeline_adapter.py) |
| 9 | Citation Checker Agent | Plain function — string append | [`pipeline_adapter.py:102`](backend/services/pipeline_adapter.py) |

Agents 6, 8, and 9 contain no model call at all. The Query Planner, for example,
is this in its entirety — an f-string:

```python
def _query_planner_agent(query, mode, document_id):
    return (
        f"Research mode: {mode}. "
        f"Use PDF retrieval: {'yes' if needs_pdf else 'no'}. "
        ...
    )
```

That's not a criticism — a deterministic router is often the *right* choice over
an LLM deciding. But if you're reading the code expecting nine models thinking in
concert, you'll be looking for something that isn't there.

### Agent vs. chain — the distinction that matters

**A chain** is a fixed pipeline: `prompt | llm | parser`. One prompt in, one
completion out, no decisions. `writer_chain` and `critic_chain` are chains.

**An agent** is a loop. The model is handed tools and decides, on each turn,
whether to call one or to stop and answer. `create_agent` from `langchain.agents`
builds a ReAct-style loop:

```mermaid
flowchart LR
    I[Input message] --> M[LLM]
    M -->|wants a tool| T[Execute tool]
    T -->|result appended| M
    M -->|no tool needed| F[Final message]
```

That loop is why agents cost more and take longer than chains — a single
`search_agent.invoke()` may hit the Mistral API several times before settling.
It's also why you read the *last* message rather than the whole response:

```python
state['search_results'] = search_results["messages"][-1].content
```

### The two tools

Both live in [`backend/tool.py`](backend/tool.py) and are decorated with
`@tool`, which is what exposes the docstring to the model as the tool
description. The model chooses tools based on those docstrings — they are
prompt text, not comments.

**`web_searcher(query)`** — Tavily search, capped at 5 results, flattened to
`Title / URL / Snippet` blocks joined by `-------`.

**`web_scraper(url)`** — `requests.get` with a 10s timeout and a browser
User-Agent, then BeautifulSoup strips `script`, `style`, `header`, `footer`,
`nav`, and `aside` before extracting text. **Output is truncated to 3000
characters** ([`tool.py:40`](backend/tool.py)) — long articles get cut off, and
that ceiling is a common cause of thin reports. Errors are caught and returned
as a string so a dead link degrades the report rather than crashing the run.

### Two generations of code living side by side

This trips people up, so it's worth stating plainly. There are **two
orchestration layers**, written at different times, and both still run:

- **[`backend/pipeline.py`](backend/pipeline.py)** — the original. Agent-driven,
  tool-using, web-only. Still has its `if __name__ == "__main__"` CLI entry point.
- **[`backend/services/pipeline_adapter.py`](backend/services/pipeline_adapter.py)** —
  the newer layer. Chain-driven, adds RAG, modes, and citation handling. It
  *calls* `pipeline.py` for web work rather than replacing it.

So `_web_search_agent()` in the adapter is a one-line wrapper around the old
pipeline:

```python
def _web_search_agent(query: str) -> Dict[str, Any]:
    return run_pipeline(query)
```

The consequence, which surprises everyone the first time: **hybrid mode runs two
writers and two critics.** `run_pipeline` internally produces a complete report
*and* a critique, and that finished report is then fed back in as raw *context*
to the Report Writer Chain, whose output is critiqued again. See
[Hybrid mode](#hybrid-mode) below.

---

## Mode-by-mode walkthrough

### Web mode

```mermaid
flowchart TB
    Q[Topic] --> S["Search Agent<br/>tool: web_searcher"]
    S -->|search_results| R["Reader Agent<br/>tool: web_scraper"]
    R -->|scraped_content| C[Combine both]
    C --> W[Writer Chain]
    W -->|report| K[Critic Chain]
    K --> O[report + feedback]
```

Entry point: `generate_report_from_web()`
([`pipeline_adapter.py:147`](backend/services/pipeline_adapter.py)). It calls
`run_pipeline()` and returns — **the planner, analyzer, and citation checker are
never invoked in web mode**, and `sources` is always `[]`.

Two details in `run_pipeline` worth noticing:

1. The reader agent only sees the **first 800 characters** of the search results
   ([`pipeline.py:22`](backend/pipeline.py)). With Tavily returning 5 results,
   800 chars covers roughly the first one or two — so the reader is choosing
   URLs from a small slice of what was found, not all of it.
2. The writer receives the **full, untruncated** `search_results` +
   `scraped_content`, so the 800-char limit constrains *URL selection* only, not
   the evidence the report is written from.

**LLM calls:** 4+ (both agents may loop).

### PDF mode

```mermaid
flowchart TB
    Q[Query + document_id] --> P[Query Planner<br/>no LLM]
    P --> R[PDF Retriever<br/>vector search, k=8]
    R --> A[Analyzer<br/>no LLM]
    A --> W[Report Writer Chain]
    W --> C[Citation Checker<br/>no LLM]
    C --> K[Critic Chain]
    K --> O[report + feedback + sources]
```

Entry point: `generate_report_from_pdf()`
([`pipeline_adapter.py:160`](backend/services/pipeline_adapter.py)).

There is a hard guard before the LLM is ever reached — if retrieval comes back
empty, the function returns a fixed "not enough information" message instead of
letting the model improvise
([`pipeline_adapter.py:128`](backend/services/pipeline_adapter.py)):

```python
if mode == "pdf" and not pdf_context.strip():
    return ("# PDF RAG Report\n\n"
            "The uploaded PDF does not contain enough relevant information...")
```

This is the single most important anti-hallucination measure in the codebase.
The system prompt also instructs the model to cite as
`[Source N, filename, page X]` and to refuse rather than invent.

**LLM calls:** 2 (writer + critic), plus 1 embedding call for the query.

### Hybrid mode

```mermaid
flowchart TB
    Q[Query + document_id] --> P[Query Planner]
    P --> R[PDF Retriever]
    P --> WP[Web pipeline<br/>run_pipeline]
    WP --> WR["Writer Chain #1<br/>full web report"]
    WR --> WC["Critic Chain #1<br/>critiques web report"]
    R --> M[Merge contexts]
    WC --> M
    M --> A[Analyzer]
    A --> RW["Report Writer Chain<br/>writer #2"]
    RW --> CC[Citation Checker]
    CC --> K["Critic Chain #2"]
    K --> O[Final report]
```

Entry point: `generate_report_from_hybrid()`
([`pipeline_adapter.py:188`](backend/services/pipeline_adapter.py)).

The merge step is literally string concatenation — the web pipeline's finished
report and its critique become a text block labelled "Web report:" that gets
pasted into the final writer's prompt:

```python
web_context = (f"Web report:\n{web_report}\n\n"
               f"Web critique feedback:\n{web_feedback}")
```

So the second writer isn't synthesising raw sources; it's synthesising *another
model's already-written report* alongside your PDF passages. That's why hybrid
is by far the slowest and most expensive mode, and why its output sometimes has
a summarised-summary quality.

**LLM calls:** 6+ (2 agent loops, 2 writers, 2 critics), plus 1 embedding.

---

## The RAG subsystem

All in [`backend/services/rag_service.py`](backend/services/rag_service.py).

### Ingestion — `POST /api/research/upload-pdf`

```mermaid
flowchart LR
    F[PDF bytes] --> S["save_uploaded_pdf<br/>uuid4 + safe filename"]
    S --> L["PyPDFLoader<br/>1 Document per page"]
    L --> M["Attach metadata<br/>document_id, filename"]
    M --> C["RecursiveCharacterTextSplitter<br/>size=1000, overlap=200"]
    C --> E["MistralAIEmbeddings<br/>mistral-embed"]
    E --> V["Chroma<br/>collection: uploaded_pdf_reports"]
```

Concrete parameters:

| Setting | Value | Why it matters |
|---|---|---|
| Chunk size | 1000 chars | Bigger = more context per hit, fewer hits fit in the prompt |
| Chunk overlap | 200 chars | Stops a sentence spanning a boundary from being lost to both chunks |
| Embedding model | `mistral-embed` | Must match at query time or retrieval returns noise |
| Collection | `uploaded_pdf_reports` | **Single shared collection for every document** |
| Chunk IDs | `f"{document_id}:{index}"` | Deterministic — re-ingesting overwrites rather than duplicating |

The filename is sanitised (`[^A-Za-z0-9_.-]` → `_`) before it touches the
filesystem, and stored on disk as `{uuid}_{safe_name}` so two users uploading
`report.pdf` don't collide.

### Retrieval

Every document shares one Chroma collection, so isolation is enforced by a
**metadata filter**, not by separate stores
([`rag_service.py:103`](backend/services/rag_service.py)):

```python
retriever = vector_store.as_retriever(
    search_kwargs={"k": 8, "filter": {"document_id": document_id}}
)
```

If that filter were ever dropped, a query would silently retrieve from *every
PDF anyone has uploaded*. It's a single line holding up the whole tenancy model
— worth knowing before you refactor near it.

Retrieved chunks come back in two shapes: a `context` string for the prompt, and
a `sources` list (`source_number`, `filename`, `page`, 250-char `preview`) which
becomes the citation cards in the UI.

---

## Progress reporting (and why it lies)

The API returns a `progress` array of seven steps. **It is synthesized after the
run finishes, not recorded during it.** From
[`services/pipeline_service.py:23`](backend/services/pipeline_service.py):

```python
def _build_progress(status, failed_at=None):
    for index, label in enumerate(STEP_LABELS, start=1):
        if status == "completed":
            step_status = "completed"   # ← every step, unconditionally
```

Consequences you should be aware of:

- On success, **all seven steps are marked `completed`** — including the PDF
  Retriever on a web-mode run, which never executed.
- On failure, step 3 is hardcoded as the failure point
  (`_build_progress("failed", failed_at=3)`), regardless of where it actually
  broke.
- Because the endpoint is one blocking call, the frontend cannot receive
  intermediate updates even in principle.

The frontend compensates rather than pretending: while a run is in flight it
shows a **time-based estimate**, explicitly labelled as an estimate, marks
agents the selected mode doesn't use as *"Not used"* rather than "completed",
and never marks the terminal step complete until the real response lands. See
[`frontend/src/hooks/useEstimatedProgress.js`](frontend/src/hooks/useEstimatedProgress.js).

**If you want genuinely live progress**, the change is: convert the endpoint to
Server-Sent Events or a websocket, and have each agent emit a status event as it
starts and finishes. That's a real architectural change, not a patch.

---

## Authentication

Added on top of the original app; entirely separate from the research pipeline.

```mermaid
flowchart LR
    S[POST /signup] --> B["bcrypt hash<br/>cost 12"]
    B --> M[(MongoDB<br/>users)]
    L[POST /login] --> V[Verify]
    V --> J[Sign JWT HS256]
    J --> C["Set httpOnly cookie<br/>researchos_session"]
    C --> ME[GET /me restores session]
```

Design decisions and their reasons:

- **Passwords are SHA-256 pre-hashed, then bcrypt'd**
  ([`auth_service.py:44`](backend/services/auth_service.py)). bcrypt silently
  ignores bytes past 72; without the digest step a long passphrase would be
  equivalent to its first 72 characters (and bcrypt 5.x raises outright).
- **The JWT lives in an httpOnly cookie**, not `localStorage`. JavaScript can't
  read it, so a frontend XSS can't exfiltrate the session.
- **`SameSite` is configurable** via `COOKIE_SAMESITE`. Must be `none` when the
  frontend and API sit on different subdomains of a public-suffix domain like
  `*.onrender.com` — browsers treat those as different *sites* and would drop a
  `Lax` cookie on every request.
- **Uniqueness is enforced by a MongoDB index**, not a pre-flight `find_one`
  ([`db/mongo.py:73`](backend/db/mongo.py)) — a check-then-insert races two
  concurrent signups through.
- **Login never reveals whether an email exists.** Unknown-email and
  wrong-password return identical 401s, and the unknown-email path runs a dummy
  bcrypt verify so response *timing* doesn't leak either.
- **`password_hash` is structurally unable to leave the API** — the `UserPublic`
  response model has no such field.

> ⚠️ **`/api/research/*` is currently unauthenticated.** The frontend route
> guard is a UX affordance only; anyone can call the research endpoints
> directly. Add `Depends(require_user)` from
> [`routes/auth.py`](backend/routes/auth.py) to close this.

---

## Frontend architecture

```
frontend/src/
├── api/           researchApi.js, authApi.js — the only files that fetch()
├── components/
│   ├── ui/        Design system: Button, Card, Modal, Tabs, Toast, …
│   ├── shell/     Sidebar, Topbar, CommandPalette, ErrorBoundary
│   ├── workspace/ QueryComposer, PdfDropzone, AgentPipeline, SourceMerge
│   ├── report/    ReportViewer, MarkdownRenderer, TableOfContents, Citations
│   ├── marketing/ Landing page sections
│   └── auth/      SocialButtons, ProtectedRoute
├── context/       AuthContext, WorkspaceContext
├── hooks/         useResearchSession ← the important one
├── layouts/       AppLayout, AuthLayout
├── pages/         Landing, Login, Signup, Dashboard, Workspace, …
├── constants/     agents.js, modes.js — mirror the backend's contracts
└── styles/        tokens.css → base → components → features
```

**[`useResearchSession.js`](frontend/src/hooks/useResearchSession.js) owns the
entire research workflow** — upload state, mode, validation, the generate call,
error handling. `Workspace.jsx` only decides layout. If you're changing
behaviour, it's almost always in the hook.

`constants/agents.js` deliberately mirrors the backend's `STEP_LABELS`
**string-for-string** — that's how the UI attaches an icon and description to
each returned step without the backend knowing anything about presentation. If
you rename a label in `pipeline_service.py`, rename it here too.

Styling is a token-driven CSS system (`styles/tokens.css`), not Tailwind. All
colour, spacing, and type flows from CSS custom properties with full light/dark
theming. Contrast ratios were measured, not eyeballed — see the gradient token
comments for why some obvious colour choices were rejected.

---

## API reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/` | — | Service banner |
| `GET` | `/health` | — | Health check |
| `POST` | `/api/auth/signup` | — | Create account, set session cookie |
| `POST` | `/api/auth/login` | — | Verify credentials, set session cookie |
| `POST` | `/api/auth/logout` | — | Clear session cookie |
| `GET` | `/api/auth/me` | cookie | Current user (used to restore a session) |
| `POST` | `/api/research/upload-pdf` | none ⚠️ | Upload + index a PDF |
| `POST` | `/api/research/generate` | none ⚠️ | Run the pipeline |

**Generate — request**

```json
{
  "topic": "Compare RAG and long-context prompting",
  "mode": "hybrid",
  "document_id": "uuid-from-upload-response"
}
```

`topic` is 3–500 chars. `mode` is `web` | `pdf` | `hybrid`. `document_id` is
**required** for `pdf` and `hybrid` — omitting it raises a `ValueError`.

**Generate — response**

```json
{
  "success": true,
  "topic": "...",
  "mode": "hybrid",
  "final_report": "# Executive Summary\n...",
  "feedback": "Score: 8/10\n...",
  "sources": [
    { "source_number": 1, "filename": "paper.pdf", "page": 4, "preview": "..." }
  ],
  "progress": [{ "id": 1, "label": "Query Planner Agent", "status": "completed" }],
  "metadata": { "mode": "hybrid", "elapsed_seconds": 42.7 }
}
```

Note that **failures return HTTP 200 with `success: false`** and an `error`
string — `generate_research_report` catches every exception
([`pipeline_service.py:99`](backend/services/pipeline_service.py)). Check the
`success` field, not the status code.

---

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MISTRAL_API_KEY` | ✅ | — | LLM + embeddings |
| `TAVILY_API_KEY` | ✅ | — | Web search (web/hybrid only) |
| `MONGODB_URI` | ✅ | — | User accounts; db name comes from the URI path |
| `JWT_SECRET` | ✅ | — | Session signing. Rotating invalidates all sessions |
| `JWT_EXPIRE_MINUTES` | | `10080` | Session lifetime (7 days) |
| `COOKIE_SECURE` | | `false` | Must be `true` over HTTPS |
| `COOKIE_SAMESITE` | | `lax` | `none` for cross-subdomain deployments |
| `FRONTEND_ORIGINS` | | localhost list | Comma-separated CORS allow-list |
| `VITE_API_BASE_URL` | | `http://127.0.0.1:8000` | **Build-time** — baked into the bundle |

> `VITE_API_BASE_URL` must live in `frontend/.env`, not the root `.env`. Vite
> reads env files from its own project root, so a value in the repo-root `.env`
> is never loaded.

---

## Deployment

Two services: a Python web service for the API, and a static site for the
frontend.

**Backend** (Render Python runtime, or any equivalent host):

| Setting | Value |
|---|---|
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/health` |

The root [`requirements.txt`](requirements.txt) is a full `pip freeze` and is
what Render's Python runtime picks up by default.
[`backend/requirements.txt`](backend/requirements.txt) is the curated,
loosely-pinned list used for local development.

> ⚠️ If you regenerate `requirements.txt` with `pip freeze > requirements.txt`
> in **PowerShell**, you'll get a UTF-16 file with a BOM, and `pip install`
> will fail on Linux builders. Use
> `pip freeze | Out-File requirements.txt -Encoding utf8` instead.

**Frontend** (static site):

| Setting | Value |
|---|---|
| Build command | `cd frontend && npm ci && npm run build` |
| Publish directory | `frontend/dist` |
| Rewrite rule | `/*` → `/index.html` (required — react-router owns client paths) |

**Cross-origin settings.** When the two services land on different hosts, set on
the backend: `FRONTEND_ORIGINS` to the exact frontend URL (no trailing slash),
`COOKIE_SECURE=true`, and — if they're subdomains of a shared platform domain
like `*.onrender.com` — `COOKIE_SAMESITE=none`. Those domains are on the public
suffix list, so browsers treat the two subdomains as different *sites* and drop
a `Lax` cookie on every request. On the frontend, set `VITE_API_BASE_URL` to the
API URL and **rebuild** — Vite inlines it at build time.

**The free-tier caveat that matters here:** free instances have no persistent
disk, and uploaded PDFs plus the Chroma index live on local disk under
`backend/storage/`. They're wiped on every redeploy *and* every time a sleeping
instance wakes. Web mode is unaffected (never touches disk); MongoDB users are
unaffected (external). PDF and hybrid modes lose their `document_id` and require
re-upload.

The durable fix, since you're already on Atlas, is migrating retrieval to
**MongoDB Atlas Vector Search** and storing PDF bytes in GridFS — that removes
the local-disk dependency entirely and works on any free host.

---

## Known limitations and gotchas

- **`backend/schemas/pipeline.py` is dead code** — a stale near-duplicate of
  `backend/pipeline.py` that nothing imports. The live module is
  `backend/pipeline.py`. Safe to delete.
- **Progress steps are synthesized**, not measured — see above.
- **Web mode reports `sources: []`** — citations are PDF-only. Web URLs appear
  inside the report body (the writer prompt asks for a Sources section) but not
  as structured data.
- **Scraped pages are truncated to 3000 characters.**
- **The reader agent sees only the first 800 chars of search results** when
  choosing which URLs to scrape.
- **One PDF per report.** `generate` takes a single `document_id`. The UI lets
  you upload several and pick which is *active*; it does not merge them.
- **No rate limiting on `/api/auth/login`** — brute-force attempts are
  unthrottled.
- **Research endpoints are unauthenticated** (see [Authentication](#authentication)).
- **Report history is `localStorage`-only** — per-browser, cleared with site
  data, no server-side persistence.

---

## A suggested reading order

If you're learning this codebase, this path builds understanding in dependency
order rather than alphabetically:

1. **[`backend/tool.py`](backend/tool.py)** — 43 lines. Two tools. See how
   `@tool` turns a docstring into something a model can choose.
2. **[`backend/agents.py`](backend/agents.py)** — where agents and chains are
   defined side by side. Compare `build_search_agent` (a loop) against
   `writer_chain` (a pipe). Read the two prompts closely; prompt design is
   where most of the output quality lives.
3. **[`backend/pipeline.py`](backend/pipeline.py)** — 50 lines, the original
   end-to-end flow. Run it standalone: `python -m backend.pipeline`.
4. **[`backend/services/rag_service.py`](backend/services/rag_service.py)** —
   a complete, compact RAG implementation: load → chunk → embed → store →
   filter → retrieve.
5. **[`backend/services/pipeline_adapter.py`](backend/services/pipeline_adapter.py)** —
   the orchestration layer. Read the three `generate_report_from_*` functions
   and diff them against each other; the differences *are* the mode logic.
6. **[`backend/services/pipeline_service.py`](backend/services/pipeline_service.py)** —
   thin API boundary. Note how it swallows exceptions into `success: false`.
7. **[`frontend/src/hooks/useResearchSession.js`](frontend/src/hooks/useResearchSession.js)** —
   the whole client-side workflow in one file.

**Good first exercises**, roughly by difficulty:

- Raise `max_results` in `web_searcher` from 5 to 8 and observe the effect on
  report depth and latency.
- Raise the scraper's 3000-char truncation and see whether reports improve.
- Tune `chunk_size` / `chunk_overlap` and re-ingest a PDF; watch how retrieval
  quality shifts.
- Make the Analyzer a real LLM call instead of string concatenation, and see
  whether it earns its latency.
- Add `Depends(require_user)` to the research routes.
- Convert `/generate` to Server-Sent Events so the progress tracker reports
  reality instead of an estimate.
