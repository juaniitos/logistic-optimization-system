"""
Routes optimization API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import itertools
from datetime import datetime
from app.models.database import get_db
from app.models.schemas import RouteOptimizationRequest, RouteOptimizationResponse
from app.models.models import Route, User, Vehicle, Warehouse
from app.services.route_planner import RoutePlanner
from app.services.route_metrics import RouteMetricsCalculator
from app.services.route_service import RouteService
from app.utils.auth import get_current_user

router = APIRouter()


class RouteCreateRequest(BaseModel):
    origin_warehouse_id: int
    destination_warehouse_ids: List[int] = Field(..., min_length=1)
    vehicle_id: Optional[int] = None
    route_name: Optional[str] = None
    use_road_routing: bool = True


def get_route_distance_for_ids(warehouse_ids: List[int], warehouses_by_id: dict[int, Warehouse]) -> float:
    coordinates = [
        (warehouses_by_id[warehouse_id].latitude, warehouses_by_id[warehouse_id].longitude)
        for warehouse_id in warehouse_ids
    ]
    return RouteService.get_route_distance(coordinates, use_road_routing=False)


def optimize_stop_order(origin_id: int, destination_ids: List[int], warehouses_by_id: dict[int, Warehouse]) -> tuple[List[int], str]:
    if len(destination_ids) <= 1:
        return [origin_id] + destination_ids, "single_destination"

    if len(destination_ids) <= 8:
        best_order = None
        best_distance = None
        for permutation in itertools.permutations(destination_ids):
            candidate = [origin_id, *permutation]
            distance = get_route_distance_for_ids(candidate, warehouses_by_id)
            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_order = candidate
        return best_order, "exact_permutation"

    unvisited = set(destination_ids)
    optimized_ids = [origin_id]
    current_id = origin_id
    while unvisited:
        current = warehouses_by_id[current_id]
        next_id = min(
            unvisited,
            key=lambda warehouse_id: RouteService.haversine_distance(
                current.latitude,
                current.longitude,
                warehouses_by_id[warehouse_id].latitude,
                warehouses_by_id[warehouse_id].longitude,
            ),
        )
        optimized_ids.append(next_id)
        unvisited.remove(next_id)
        current_id = next_id
    return optimized_ids, "nearest_neighbor"


def calculate_route_values(
    ordered_ids: List[int],
    warehouses_by_id: dict[int, Warehouse],
    vehicle: Optional[Vehicle],
    use_road_routing: bool,
) -> tuple[float, float, float, list]:
    ordered_warehouses = [warehouses_by_id[warehouse_id] for warehouse_id in ordered_ids]
    coordinates = [(warehouse.latitude, warehouse.longitude) for warehouse in ordered_warehouses]
    route_info = RouteService.get_route_geometry(coordinates, timeout=5) if use_road_routing else None

    if route_info:
        total_distance = round(route_info["distance"], 2)
        duration_seconds = route_info["duration"]
        geometry = route_info["geometry"]
    else:
        total_distance = round(RouteService.get_route_distance(coordinates, use_road_routing=False), 2)
        duration_seconds = (total_distance / 40) * 3600 if total_distance else 0
        geometry = [[warehouse.latitude, warehouse.longitude] for warehouse in ordered_warehouses]

    fuel_consumption = vehicle.fuel_consumption if vehicle and vehicle.fuel_consumption else 1.5
    total_cost = round(total_distance * fuel_consumption * 1.5, 2)
    return total_distance, round(duration_seconds / 3600, 2), total_cost, geometry


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


@router.post("/")
async def create_route(
    request: RouteCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create and save a complete route with one origin and multiple destinations.
    """
    if request.origin_warehouse_id in request.destination_warehouse_ids:
        raise HTTPException(
            status_code=400,
            detail="El origen no puede repetirse como destino"
        )

    ordered_ids = [request.origin_warehouse_id] + request.destination_warehouse_ids
    warehouses = db.query(Warehouse).filter(Warehouse.id.in_(ordered_ids)).all()
    warehouses_by_id = {warehouse.id: warehouse for warehouse in warehouses}
    missing_ids = [warehouse_id for warehouse_id in ordered_ids if warehouse_id not in warehouses_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontraron puntos para los IDs: {missing_ids}"
        )

    ordered_warehouses = [warehouses_by_id[warehouse_id] for warehouse_id in ordered_ids]

    vehicle = None
    if request.vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == request.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    route_name = request.route_name or " -> ".join(warehouse.name for warehouse in ordered_warehouses)
    total_distance, estimated_time, total_cost, geometry = calculate_route_values(
        ordered_ids,
        warehouses_by_id,
        vehicle,
        request.use_road_routing,
    )

    db_route = Route(
        vehicle_id=request.vehicle_id,
        origin_warehouse_id=request.origin_warehouse_id,
        route_name=route_name,
        total_distance=total_distance,
        estimated_time=estimated_time,
        total_cost=total_cost,
        status="planned",
        route_data=json.dumps({
            "origin_warehouse_id": request.origin_warehouse_id,
            "destination_warehouse_ids": request.destination_warehouse_ids,
            "ordered_stop_ids": ordered_ids,
            "ordered_stop_names": [warehouse.name for warehouse in ordered_warehouses],
            "geometry": geometry,
            "use_road_routing": request.use_road_routing,
        }),
    )
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route


@router.post("/{route_id}/optimize")
async def optimize_saved_route(
    route_id: int,
    use_road_routing: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Optimize the stop order of a saved route before dispatch.
    """
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    if route.status not in ["planned"]:
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden optimizar rutas planificadas antes de iniciar el despacho"
        )
    if not route.route_data:
        raise HTTPException(
            status_code=400,
            detail="La ruta no tiene datos de paradas para optimizar"
        )

    try:
        route_data = json.loads(route.route_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="La ruta tiene datos inválidos")

    ordered_ids = route_data.get("original_ordered_stop_ids") or route_data.get("ordered_stop_ids")
    if not ordered_ids or len(ordered_ids) < 2:
        origin_id = route_data.get("origin_warehouse_id") or route.origin_warehouse_id
        destination_ids = route_data.get("destination_warehouse_ids") or []
        ordered_ids = [origin_id, *destination_ids] if origin_id else []

    if len(ordered_ids) < 2:
        raise HTTPException(
            status_code=400,
            detail="La ruta necesita al menos un origen y un destino para optimizar"
        )

    origin_id = ordered_ids[0]
    destination_ids = ordered_ids[1:]
    all_ids = list(dict.fromkeys([origin_id, *destination_ids]))
    warehouses = db.query(Warehouse).filter(Warehouse.id.in_(all_ids)).all()
    warehouses_by_id = {warehouse.id: warehouse for warehouse in warehouses}
    missing_ids = [warehouse_id for warehouse_id in all_ids if warehouse_id not in warehouses_by_id]
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontraron puntos para los IDs: {missing_ids}"
        )

    optimized_ids, method = optimize_stop_order(origin_id, destination_ids, warehouses_by_id)

    vehicle = db.query(Vehicle).filter(Vehicle.id == route.vehicle_id).first() if route.vehicle_id else None
    should_use_road_routing = route_data.get("use_road_routing", True) if use_road_routing is None else use_road_routing
    original_distance, _, _, _ = calculate_route_values(
        ordered_ids,
        warehouses_by_id,
        vehicle,
        should_use_road_routing,
    )
    total_distance, estimated_time, total_cost, geometry = calculate_route_values(
        optimized_ids,
        warehouses_by_id,
        vehicle,
        should_use_road_routing,
    )
    optimized_distance_for_comparison = total_distance

    distance_saved = max(original_distance - optimized_distance_for_comparison, 0)
    distance_saved_percent = (distance_saved / original_distance * 100) if original_distance else 0
    optimized_stop_names = [warehouses_by_id[warehouse_id].name for warehouse_id in optimized_ids]
    original_stop_names = route_data.get("original_ordered_stop_names") or [
        warehouses_by_id[warehouse_id].name for warehouse_id in ordered_ids
    ]
    num_stops = max(len(optimized_ids) - 1, 0)
    original_metrics = RouteMetricsCalculator.calculate_complete_metrics(
        original_distance,
        num_stops,
        original_distance,
    )
    optimized_metrics = RouteMetricsCalculator.calculate_complete_metrics(
        optimized_distance_for_comparison,
        num_stops,
        original_distance,
    )

    route.route_name = route.route_name or " -> ".join(optimized_stop_names)
    route.origin_warehouse_id = origin_id
    route.total_distance = total_distance
    route.estimated_time = estimated_time
    route.total_cost = total_cost
    route.route_data = json.dumps({
        **route_data,
        "origin_warehouse_id": origin_id,
        "destination_warehouse_ids": optimized_ids[1:],
        "ordered_stop_ids": optimized_ids,
        "ordered_stop_names": optimized_stop_names,
        "geometry": geometry,
        "use_road_routing": should_use_road_routing,
        "optimized_at": datetime.utcnow().isoformat(),
        "optimization_method": method,
        "original_ordered_stop_ids": ordered_ids,
        "original_ordered_stop_names": original_stop_names,
        "optimization_summary": {
            "original_distance_km": round(original_distance, 2),
            "optimized_distance_km": round(optimized_distance_for_comparison, 2),
            "distance_saved_km": round(distance_saved, 2),
            "distance_saved_percent": round(distance_saved_percent, 2),
            "original_metrics": original_metrics,
            "optimized_metrics": optimized_metrics,
            "use_road_routing": should_use_road_routing,
        },
    })

    db.commit()
    db.refresh(route)
    return {
        "message": "Ruta optimizada correctamente",
        "route": route,
        "optimization": {
            "method": method,
            "original_stop_ids": ordered_ids,
            "optimized_stop_ids": optimized_ids,
            "original_stop_names": original_stop_names,
            "optimized_stop_names": optimized_stop_names,
            "original_distance_km": round(original_distance, 2),
            "optimized_distance_km": round(optimized_distance_for_comparison, 2),
            "distance_saved_km": round(distance_saved, 2),
            "distance_saved_percent": round(distance_saved_percent, 2),
            "original_metrics": original_metrics,
            "optimized_metrics": optimized_metrics,
            "use_road_routing": should_use_road_routing,
        },
    }


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
    routes = db.query(Route).offset(skip).limit(limit).all()
    return routes
