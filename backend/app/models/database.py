"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

def normalize_database_url(database_url: str) -> str:
    """Use the installed psycopg v3 driver for PostgreSQL URLs."""
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url

# Create database engine
engine = create_engine(
    normalize_database_url(settings.DATABASE_URL),
    pool_pre_ping=True,
    echo=settings.SQL_ECHO
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency for database session
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
