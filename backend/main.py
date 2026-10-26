import os
from contextlib import asynccontextmanager
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db.mongo import close_mongo, init_mongo
from .netfix import install_nat64_resolver_guard
from .routes.auth import router as auth_router
from .routes.research import router as research_router

load_dotenv()


def _allowed_origins() -> List[str]:
    configured = os.getenv("FRONTEND_ORIGINS", "")
    if configured.strip():
        return [origin.strip() for origin in configured.split(",") if origin.strip()]

    return [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]


@asynccontextmanager
async def lifespan(_: FastAPI):
    """
    Open the Mongo connection and build indexes once, at startup.

    Connecting here rather than lazily means a bad MONGODB_URI surfaces
    immediately instead of as a 500 on someone's first signup attempt.

    The resolver guard goes first: on a DNS64 network an unguarded lookup
    hands PyMongo a dead NAT64 address per replica set member, and the
    stacked connect timeouts blow past serverSelectionTimeoutMS.
    """
    install_nat64_resolver_guard()
    await init_mongo()
    try:
        yield
    finally:
        await close_mongo()


app = FastAPI(
    title="AI Research Report Generator API",
    description="FastAPI wrapper around the existing Python research agent pipeline.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(research_router, prefix="/api/research", tags=["research"])


@app.get("/")
def root():
    return {
        "name": "AI Research Report Generator API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
