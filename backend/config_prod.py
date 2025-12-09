"""
Configuración de producción para AWS
"""
import os

# Configuración de la base de datos
# En producción usamos SQLite en el mismo servidor (gratis)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./logistic.db")

# Configuración del servidor
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# CORS - Permitir el dominio del frontend en S3
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

# Secret key para JWT (cambiar en producción)
SECRET_KEY = os.getenv("SECRET_KEY", "tu-secret-key-cambiar-en-produccion")

