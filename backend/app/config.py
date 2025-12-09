"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Sistema de Optimización Logística"
    
    # Database
    # Para desarrollo con SQLite (sin necesidad de PostgreSQL):
    DATABASE_URL: str = "sqlite:///./logistic.db"
    # Para producción con PostgreSQL (requiere Docker o instalación local):
    # DATABASE_URL: str = "postgresql+psycopg://logistic_user:logistic_pass@localhost:5432/logistic_db"
    
    # Redis Cache
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]
    
    # ML Models
    MODEL_PATH: str = "./data/models"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
