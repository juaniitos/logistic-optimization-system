#!/bin/bash
# Script para iniciar el backend en producción

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias si es necesario
pip install -r requirements.txt

# Iniciar con uvicorn en modo producción
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2

