"""
Sistema de Optimización Logística - UPSE 2025-2
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes, inventory, analytics, drivers
from app.routes import auth
from app.models.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Sistema de Optimización Logística",
    description="API para optimización de rutas, gestión de inventarios, transportistas y análisis predictivo",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(routes.router, prefix="/api/routes", tags=["Routes Optimization"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory Management"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics & Predictions"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["Drivers Management"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Sistema de Optimización Logística - UPSE",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
