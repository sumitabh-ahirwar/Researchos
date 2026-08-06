import base64
import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from ..db.mongo import get_users_collection
from ..schemas.auth_schema import UserPublic

load_dotenv()

JWT_ALGORITHM = "HS256"
DEFAULT_EXPIRE_MINUTES = 60 * 24 * 7  # one week


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "").strip()
    if not secret:
        raise RuntimeError(
            "JWT_SECRET is not set. Add a long random value to .env before starting the API."
        )
    return secret


def _expire_minutes() -> int:
    try:
        return int(os.getenv("JWT_EXPIRE_MINUTES", DEFAULT_EXPIRE_MINUTES))
    except ValueError:
        return DEFAULT_EXPIRE_MINUTES


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

def _prehash(password: str) -> bytes:
    """
    SHA-256 the password, then base64 it, before handing it to bcrypt.

    bcrypt ignores everything past the 72nd byte. Without this step a 100-byte
    passphrase would be silently equivalent to its first 72 bytes — and bcrypt
    5.x raises outright instead. Digesting first gives a fixed 44-byte input,
    so the full password always contributes to the hash.
    """
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prehash(password), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_prehash(password), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        # Malformed or legacy hash in the database — treat as a failed login
        # rather than raising a 500 that would confirm the account exists.
        return False


# ---------------------------------------------------------------------------
# Tokens
# ---------------------------------------------------------------------------

def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=_expire_minutes()),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """Return the user id in a valid token, or None if it is invalid/expired."""
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None

    subject = payload.get("sub")
    return subject if isinstance(subject, str) else None


def token_max_age_seconds() -> int:
    return _expire_minutes() * 60


# ---------------------------------------------------------------------------
# Serialisation
# ---------------------------------------------------------------------------

def to_public_user(document: Dict[str, Any]) -> UserPublic:
    return UserPublic(
        id=str(document["_id"]),
        name=document["name"],
        email=document["email"],
        created_at=document.get("created_at") or datetime.now(timezone.utc),
    )


def normalise_email(email: str) -> str:
    """Emails are stored lower-cased so lookups and the unique index agree."""
    return email.strip().lower()


# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------

async def register_user(name: str, email: str, password: str) -> Dict[str, Any]:
    """
    Create a user.

    The unique index is what actually enforces one-account-per-email; the
    DuplicateKeyError branch is the real check, not a fallback. A pre-flight
    find_one() would still race two concurrent signups through.
    """
    users = get_users_collection()
    now = datetime.now(timezone.utc)

    document = {
        "name": name.strip(),
        "email": normalise_email(email),
        "password_hash": hash_password(password),
        "created_at": now,
        "updated_at": now,
    }

    try:
        result = await users.insert_one(document)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists.",
        )

    document["_id"] = result.inserted_id
    return document


async def authenticate_user(email: str, password: str) -> Dict[str, Any]:
    """
    Verify credentials.

    Both the unknown-email and wrong-password paths return the same message, so
    the endpoint cannot be used to enumerate which addresses have accounts. The
    dummy verify on the missing-user path keeps the response time similar in
    both cases.
    """
    users = get_users_collection()
    user = await users.find_one({"email": normalise_email(email)})

    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password.",
    )

    if user is None:
        verify_password(password, "$2b$12$" + "." * 53)
        raise invalid

    if not verify_password(password, user.get("password_hash", "")):
        raise invalid

    return user


async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    try:
        object_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        return None

    return await get_users_collection().find_one({"_id": object_id})
