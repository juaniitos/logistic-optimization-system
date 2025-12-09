"""
Routes optimization API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.models.database import get_db
from app.models.schemas import RouteOptimizationRequest, RouteOptimizationResponse
from app.services.route_planner import RoutePlanner

router = APIRouter()


@router.post("/optimize", response_model=RouteOptimizationResponse)
async def optimize_route(
    request: RouteOptimizationRequest,
    db: Session = Depends(get_db)
):
    """
    Optimize route for multiple destinations
    
    - **origin**: Starting point with latitude/longitude
    - **destinations**: List of delivery points
    - **vehicle_id**: Optional vehicle ID for capacity constraints
    """
    try:
        planner = RoutePlanner(db)
        result = await planner.optimize_route(
            origin=request.origin,
            destinations=request.destinations,
            vehicle_id=request.vehicle_id,
            max_distance=request.max_distance,
            max_time=request.max_time
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calculate-distance")
async def calculate_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
):
    """
    Calculate distance between two points
    """
    try:
        planner = RoutePlanner(None)
        distance = planner.calculate_distance(lat1, lon1, lat2, lon2)
        return {
            "distance_km": round(distance, 2),
            "from": {"latitude": lat1, "longitude": lon1},
            "to": {"latitude": lat2, "longitude": lon2}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def get_routes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all routes with pagination
    """
    from app.models.models import Route
    routes = db.query(Route).offset(skip).limit(limit).all()
    return routes
