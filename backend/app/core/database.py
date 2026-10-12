import os
import urllib.parse
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.engine import URL, make_url
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

def get_normalized_database_url(raw_url: str):
    import re
    url_str = raw_url.strip() if raw_url else "sqlite:///./novahouse.db"
    url_str = re.sub(r'^(DATABASE_URL\s*=\s*)+', '', url_str).strip()
    # Enforce postgresql+psycopg2 driver dialect for PostgreSQL connections
    if url_str.startswith("postgres://"):
        url_str = url_str.replace("postgres://", "postgresql+psycopg2://", 1)
    elif url_str.startswith("postgresql://"):
        url_str = url_str.replace("postgresql://", "postgresql+psycopg2://", 1)

    if url_str.startswith("sqlite"):
        if url_str.startswith("sqlite:///./") or url_str == "sqlite:///novahouse.db":
            base_dir = Path(__file__).resolve().parent.parent.parent.parent
            return f"sqlite:///{base_dir / 'novahouse.db'}"
        return url_str

    # Robust parsing for PostgreSQL URLs handling special characters (e.g. @, #, $) in password
    if (url_str.startswith("postgresql+psycopg2://") or url_str.startswith("postgresql://") or url_str.startswith("postgres://")) and "@" in url_str:
        scheme, rest = url_str.split("://", 1)
        driver = "postgresql+psycopg2"
        creds, host_part = rest.rsplit("@", 1)
        user, pwd = creds.split(":", 1) if ":" in creds else (creds, None)

        if pwd is not None:
            pwd = urllib.parse.unquote(pwd)
        if user is not None:
            user = urllib.parse.unquote(user)

        query = {}
        if "?" in host_part:
            host_part, query_str = host_part.split("?", 1)
            query = dict(urllib.parse.parse_qsl(query_str))

        if "/" in host_part:
            host_part_clean, dbname = host_part.split("/", 1)
        else:
            host_part_clean, dbname = host_part, "postgres"

        if ":" in host_part_clean:
            host, port_str = host_part_clean.split(":", 1)
            port = int(port_str) if port_str.isdigit() else None
        else:
            host, port = host_part_clean, None

        return URL.create(
            drivername=driver,
            username=user,
            password=pwd,
            host=host,
            port=port,
            database=dbname,
            query=query
        )

    return make_url(url_str)

DATABASE_URL = get_normalized_database_url(settings.DATABASE_URL)
is_sqlite = (isinstance(DATABASE_URL, str) and DATABASE_URL.startswith("sqlite")) or (
    isinstance(DATABASE_URL, URL) and DATABASE_URL.drivername.startswith("sqlite")
)

engine_kwargs = {"echo": False}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL (Supabase Session Pooler / PgBouncer / Direct)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
