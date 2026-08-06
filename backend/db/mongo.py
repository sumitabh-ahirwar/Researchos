import os
from typing import Optional

import certifi
from dotenv import load_dotenv
from pymongo import AsyncMongoClient
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import PyMongoError

load_dotenv()

DEFAULT_DB_NAME = "Researchos"
USERS_COLLECTION = "users"

# A single client is shared for the process lifetime. PyMongo maintains its own
# connection pool internally, so creating a client per request would throw away
# pooling and re-run SRV/TLS negotiation on every call.
_client: Optional[AsyncMongoClient] = None
_database: Optional[AsyncDatabase] = None


def _mongo_uri() -> str:
    uri = os.getenv("MONGODB_URI", "").strip()
    if not uri:
        raise RuntimeError(
            "MONGODB_URI is not set. Add it to .env before starting the API."
        )
    return uri


async def init_mongo() -> AsyncDatabase:
    """
    Open the shared connection and make sure the indexes we rely on exist.

    Called once from the FastAPI lifespan handler. Failing here is deliberate:
    if the database is unreachable the auth routes cannot work, and finding
    that out at startup is better than discovering it on a user's first signup.
    """
    global _client, _database

    if _database is not None:
        return _database

    # certifi is passed explicitly because Atlas connections fail TLS
    # verification on Windows Python builds that lack a usable system CA store.
    _client = AsyncMongoClient(
        _mongo_uri(),
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=10000,
        appname="researchos-api",
    )

    # get_default_database() reads the db name from the URI path (…/Researchos).
    try:
        _database = _client.get_default_database()
    except Exception:
        _database = None

    if _database is None:
        _database = _client[DEFAULT_DB_NAME]

    await _client.admin.command("ping")
    await _ensure_indexes(_database)

    return _database


async def _ensure_indexes(database: AsyncDatabase) -> None:
    """
    Unique index on email.

    This is the real guard against duplicate accounts — the check-then-insert in
    the service layer races under concurrent signups, and only the index makes
    the constraint authoritative.
    """
    try:
        await database[USERS_COLLECTION].create_index("email", unique=True, name="uniq_email")
    except PyMongoError as exc:
        raise RuntimeError(f"Could not create the users email index: {exc}") from exc


def get_database() -> AsyncDatabase:
    if _database is None:
        raise RuntimeError("Mongo is not initialised. init_mongo() runs on startup.")
    return _database


def get_users_collection() -> AsyncCollection:
    return get_database()[USERS_COLLECTION]


async def close_mongo() -> None:
    global _client, _database

    if _client is not None:
        await _client.close()

    _client = None
    _database = None
