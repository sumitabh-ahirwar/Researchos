import os
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from ..schemas.auth_schema import AuthResponse, LoginRequest, SignupRequest, UserPublic
from ..services.auth_service import (
    authenticate_user,
    create_access_token,
    decode_access_token,
    get_user_by_id,
    register_user,
    to_public_user,
    token_max_age_seconds,
)

router = APIRouter()

SESSION_COOKIE = "researchos_session"


def _cookie_samesite() -> str:
    """
    Cross-site cookie policy.

    Defaults to "lax", which is correct for local dev (127.0.0.1 frontend and
    API, same site, different ports) and for a deployment where the frontend
    and API share a registrable domain (app.example.com + api.example.com).

    It is WRONG on platforms like Render, Vercel, or Netlify when frontend and
    backend land on different subdomains of a shared platform domain
    (*.onrender.com, *.vercel.app) — those domains are on the public suffix
    list specifically so the platform's own customers can't read each other's
    cookies, which means two subdomains under them count as different *sites*,
    not just different origins. Lax cookies are silently dropped on that
    cross-site fetch. Set COOKIE_SAMESITE=none in that case (and COOKIE_SECURE
    must be true — browsers reject SameSite=None without Secure).
    """
    value = os.getenv("COOKIE_SAMESITE", "lax").strip().lower()
    return value if value in {"lax", "strict", "none"} else "lax"


def _cookie_secure() -> bool:
    """
    Secure cookies require HTTPS, which the local dev server does not serve.
    Defaults to off so login works over http://127.0.0.1, and must be turned on
    for any deployment that is not localhost. Forced on when SameSite=None,
    since browsers drop such cookies otherwise regardless of this setting.
    """
    explicit = os.getenv("COOKIE_SECURE", "false").strip().lower() in {"1", "true", "yes"}
    return explicit or _cookie_samesite() == "none"


def _set_session_cookie(response: Response, token: str) -> None:
    """
    The token is stored in an httpOnly cookie rather than returned in the body.
    JavaScript cannot read it, so an XSS bug on the frontend cannot exfiltrate
    the session — which is the main argument against keeping JWTs in
    localStorage.
    """
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=token_max_age_seconds(),
        httponly=True,
        samesite=_cookie_samesite(),
        secure=_cookie_secure(),
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=SESSION_COOKIE,
        path="/",
        samesite=_cookie_samesite(),
        secure=_cookie_secure(),
    )


async def _user_from_request(request: Request) -> Optional[Dict[str, Any]]:
    """
    Resolve the caller from the session cookie, falling back to a bearer token.

    The header fallback exists so the interactive API docs and curl can be used
    without a browser; the frontend always uses the cookie.
    """
    token = request.cookies.get(SESSION_COOKIE)

    if not token:
        header = request.headers.get("Authorization", "")
        if header.lower().startswith("bearer "):
            token = header[7:].strip()

    if not token:
        return None

    user_id = decode_access_token(token)
    if not user_id:
        return None

    return await get_user_by_id(user_id)


async def require_user(request: Request) -> Dict[str, Any]:
    """Dependency for routes that must have an authenticated caller."""
    user = await _user_from_request(request)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    return user


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, response: Response) -> AuthResponse:
    """Create an account and start a session."""
    user = await register_user(payload.name, payload.email, payload.password)

    _set_session_cookie(response, create_access_token(str(user["_id"])))

    return AuthResponse(
        success=True,
        user=to_public_user(user),
        message="Account created.",
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, response: Response) -> AuthResponse:
    """Verify credentials and start a session."""
    user = await authenticate_user(payload.email, payload.password)

    _set_session_cookie(response, create_access_token(str(user["_id"])))

    return AuthResponse(
        success=True,
        user=to_public_user(user),
        message="Signed in.",
    )


@router.post("/logout", response_model=AuthResponse)
async def logout(response: Response) -> AuthResponse:
    """Clear the session cookie. Safe to call when already signed out."""
    _clear_session_cookie(response)
    return AuthResponse(success=True, message="Signed out.")


@router.get("/me", response_model=UserPublic)
async def me(user: Dict[str, Any] = Depends(require_user)) -> UserPublic:
    """Return the signed-in user. The frontend calls this to restore a session."""
    return to_public_user(user)
