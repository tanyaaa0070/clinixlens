"""
ClinixLens — Database Engine & Session Management
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

import urllib.parse

# Normalize database URL for async driver compatibility
raw_url = settings.database_url
connect_args = {}

if raw_url.startswith(("postgres://", "postgresql://")):
    if not raw_url.startswith("postgresql+asyncpg://"):
        raw_url = "postgresql+asyncpg://" + raw_url.split("://", 1)[1]
    
    parsed = urllib.parse.urlparse(raw_url)
    # Clean query string parameters (like sslmode, channel_binding) which asyncpg doesn't parse via URL query
    db_url = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))
    connect_args = {"ssl": True}
elif settings.is_sqlite:
    db_url = raw_url
    connect_args = {"check_same_thread": False}
else:
    db_url = raw_url

engine = create_async_engine(
    db_url,
    echo=settings.debug,
    connect_args=connect_args,
    pool_pre_ping=True,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Dependency: yields a database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Dispose engine."""
    await engine.dispose()
