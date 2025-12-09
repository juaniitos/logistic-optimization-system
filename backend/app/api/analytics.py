"""
Analytics and predictions API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.models.database import get_db
from app.services.predictor import DemandPredictor

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_data(db: Session = Depends(get_db)):
    """
    Get dashboard summary data
    """
    from app.models.models import Product, Warehouse, Vehicle, InventoryItem
    from sqlalchemy import func
    
    try:
        # Basic statistics
        total_products = db.query(func.count(Product.id)).scalar()
        total_warehouses = db.query(func.count(Warehouse.id)).scalar()
        total_vehicles = db.query(func.count(Vehicle.id)).scalar()
        
        # Inventory stats
        low_stock_items = db.query(func.count(InventoryItem.id)).filter(
            InventoryItem.quantity <= InventoryItem.reorder_point
        ).scalar()
        
        total_inventory_value = db.query(
            func.sum(InventoryItem.quantity * Product.unit_price)
        ).join(Product).scalar() or 0
        
        return {
            "total_products": total_products,
            "total_warehouses": total_warehouses,
            "total_vehicles": total_vehicles,
            "low_stock_items": low_stock_items,
            "total_inventory_value": round(total_inventory_value, 2),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/inventory-trends")
async def get_inventory_trends(
    warehouse_id: Optional[int] = None,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get inventory trends over time
    """
    try:
        # Placeholder for time series data
        # In production, this would query historical data
        return {
            "warehouse_id": warehouse_id,
            "period_days": days,
            "message": "Time series data would be returned here"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/demand-forecast")
async def get_demand_forecast(
    product_id: int,
    warehouse_id: int,
    forecast_days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get demand forecast for a specific product and warehouse
    """
    try:
        predictor = DemandPredictor(db)
        forecast = await predictor.forecast_demand(
            product_id=product_id,
            warehouse_id=warehouse_id,
            forecast_days=forecast_days
        )
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/generate")
async def generate_report(
    report_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Generate various types of reports
    
    - **report_type**: inventory, routes, costs, efficiency
    """
    try:
        return {
            "report_type": report_type,
            "start_date": start_date,
            "end_date": end_date,
            "message": "Report generation logic would be implemented here"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/genetic-algorithm")
async def optimize_routes_genetic(
    num_vehicles: int = 3,
    population_size: int = 100,
    generations: int = 200,
    use_road_routing: bool = True,
    db: Session = Depends(get_db)
):
    """
    Optimiza rutas usando Algoritmo Genético con métricas de sostenibilidad
    
    - **num_vehicles**: Número de vehículos disponibles
    - **population_size**: Tamaño de la población
    - **generations**: Número de generaciones
    - **use_road_routing**: Si True, usa rutas por carreteras reales (OSRM)
    """
    from app.models.models import Warehouse
    from app.services.genetic_algorithm import GeneticAlgorithmVRP
    from app.services.route_metrics import RouteMetricsCalculator
    from app.services.route_service import RouteService
    
    try:
        # Obtener bodegas
        warehouses = db.query(Warehouse).all()
        if not warehouses:
            raise HTTPException(status_code=404, detail="No hay bodegas disponibles")
        
        # Preparar datos
        warehouse_data = [
            {
                'id': w.id,
                'name': w.name,
                'latitude': w.latitude,
                'longitude': w.longitude
            }
            for w in warehouses
        ]
        
        # Ejecutar algoritmo genético
        ga = GeneticAlgorithmVRP(
            population_size=population_size,
            generations=generations,
            mutation_rate=0.1,
            crossover_rate=0.8,
            elite_size=10
        )
        
        result = ga.optimize(warehouse_data, num_vehicles, verbose=False)
        
        # Calcular métricas de sostenibilidad y obtener geometrías reales
        routes_for_metrics = []
        routes_with_geometry = []
        
        for route in result.get("routes", []):
            warehouse_indices = route.get("warehouses", [])
            
            # Obtener ruta real con geometría de carreteras
            route_info = RouteService.get_route_with_geometry(
                warehouse_indices,
                warehouse_data,
                use_road_routing=use_road_routing
            )
            
            # Actualizar distancia con la distancia real
            route["distance"] = route_info["distance"]
            route["warehouse_indices"] = warehouse_indices
            route["geometry"] = route_info["geometry"]  # Agregar geometría para el mapa
            route["duration"] = route_info.get("duration", 0)
            
            routes_with_geometry.append(route)
            
            routes_for_metrics.append({
                "distance": route_info["distance"],
                "num_stops": len(warehouse_indices) - 1
            })
        
        # Actualizar resultado con rutas que tienen geometría
        result["routes"] = routes_with_geometry
        
        metrics = RouteMetricsCalculator.calculate_multi_vehicle_metrics(routes_for_metrics)
        
        return {
            "success": True,
            "algorithm": "Genetic Algorithm",
            "result": result,
            "metrics": metrics
        }
        
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"ERROR en genetic-algorithm: {error_detail}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/simulated-annealing")
async def optimize_route_simulated_annealing(
    start_warehouse_id: Optional[int] = None,
    initial_temperature: float = 1000.0,
    cooling_rate: float = 0.95,
    use_road_routing: bool = True,
    db: Session = Depends(get_db)
):
    """
    Optimiza una ruta usando Simulated Annealing
    
    - **start_warehouse_id**: ID de la bodega inicial (opcional)
    - **initial_temperature**: Temperatura inicial
    - **cooling_rate**: Tasa de enfriamiento (0-1)
    - **use_road_routing**: Si True, usa rutas por carreteras reales (OSRM)
    """
    from app.models.models import Warehouse
    from app.services.simulated_annealing import SimulatedAnnealingTSP
    from app.services.route_service import RouteService
    
    try:
        # Obtener bodegas
        warehouses = db.query(Warehouse).all()
        if not warehouses:
            raise HTTPException(status_code=404, detail="No hay bodegas disponibles")
        
        # Preparar datos
        warehouse_data = [
            {
                'id': w.id,
                'name': w.name,
                'latitude': w.latitude,
                'longitude': w.longitude
            }
            for w in warehouses
        ]
        
        # Determinar bodega inicial
        start_idx = 0
        if start_warehouse_id:
            for idx, w in enumerate(warehouse_data):
                if w['id'] == start_warehouse_id:
                    start_idx = idx
                    break
        
        # Ejecutar Simulated Annealing
        sa = SimulatedAnnealingTSP(
            initial_temperature=initial_temperature,
            cooling_rate=cooling_rate,
            min_temperature=1.0,
            max_iterations=100
        )
        
        result = sa.optimize(warehouse_data, start_idx, use_2opt=True, verbose=False)
        
        # Obtener ruta real con geometría
        route_indices = result.get("route", [])
        route_info = RouteService.get_route_with_geometry(
            route_indices,
            warehouse_data,
            use_road_routing=use_road_routing
        )
        
        # Actualizar resultado con distancia real y geometría
        result["total_distance"] = route_info["distance"]
        result["geometry"] = route_info["geometry"]
        result["duration"] = route_info.get("duration", 0)
        
        # Calcular métricas
        from app.services.route_metrics import RouteMetricsCalculator
        num_stops = len(route_indices) - 1
        metrics = RouteMetricsCalculator.calculate_complete_metrics(
            route_info["distance"],
            num_stops
        )
        
        return {
            "success": True,
            "algorithm": "Simulated Annealing",
            "result": result,
            "metrics": metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/optimize/two-opt")
async def optimize_route_two_opt(
    initial_route: Optional[list] = None,
    max_iterations: int = 1000,
    use_road_routing: bool = True,
    db: Session = Depends(get_db)
):
    """
    Mejora una ruta usando el algoritmo 2-opt
    
    - **initial_route**: Ruta inicial como lista de IDs de bodegas (opcional)
    - **max_iterations**: Máximo de iteraciones sin mejora
    - **use_road_routing**: Si True, usa rutas por carreteras reales (OSRM)
    """
    from app.models.models import Warehouse
    from app.services.simulated_annealing import TwoOptOptimizer
    from app.services.route_service import RouteService
    
    try:
        # Obtener bodegas
        warehouses = db.query(Warehouse).all()
        if not warehouses:
            raise HTTPException(status_code=404, detail="No hay bodegas disponibles")
        
        # Preparar datos
        warehouse_data = [
            {
                'id': w.id,
                'name': w.name,
                'latitude': w.latitude,
                'longitude': w.longitude
            }
            for w in warehouses
        ]
        
        # Convertir IDs a índices si se proporciona initial_route
        route_indices = None
        if initial_route:
            route_indices = []
            for wh_id in initial_route:
                for idx, w in enumerate(warehouse_data):
                    if w['id'] == wh_id:
                        route_indices.append(idx)
                        break
        
        # Ejecutar 2-opt
        result = TwoOptOptimizer.optimize(
            warehouse_data,
            initial_route=route_indices,
            max_iterations=max_iterations,
            verbose=False
        )
        
        # Obtener ruta real con geometría
        route_indices_result = result.get("route", [])
        route_info = RouteService.get_route_with_geometry(
            route_indices_result,
            warehouse_data,
            use_road_routing=use_road_routing
        )
        
        # Actualizar resultado con distancia real y geometría
        result["total_distance"] = route_info["distance"]
        result["geometry"] = route_info["geometry"]
        result["duration"] = route_info.get("duration", 0)
        
        # Calcular métricas
        from app.services.route_metrics import RouteMetricsCalculator
        num_stops = len(route_indices_result) - 1
        metrics = RouteMetricsCalculator.calculate_complete_metrics(
            route_info["distance"],
            num_stops
        )
        
        return {
            "success": True,
            "algorithm": "2-opt",
            "result": result,
            "metrics": metrics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/optimize/compare")
async def compare_algorithms(
    num_vehicles: int = 3,
    db: Session = Depends(get_db)
):
    """
    Compara todos los algoritmos de optimización
    
    - **num_vehicles**: Número de vehículos para algoritmos que lo requieren
    """
    from app.models.models import Warehouse
    from app.services.genetic_algorithm import GeneticAlgorithmVRP
    from app.services.simulated_annealing import SimulatedAnnealingTSP, TwoOptOptimizer
    
    try:
        # Obtener bodegas
        warehouses = db.query(Warehouse).all()
        if not warehouses:
            raise HTTPException(status_code=404, detail="No hay bodegas disponibles")
        
        # Preparar datos
        warehouse_data = [
            {
                'id': w.id,
                'name': w.name,
                'latitude': w.latitude,
                'longitude': w.longitude
            }
            for w in warehouses
        ]
        
        results = {}
        
        # 1. Algoritmo Genético
        try:
            ga = GeneticAlgorithmVRP(
                population_size=50,
                generations=100,
                mutation_rate=0.1,
                crossover_rate=0.8
            )
            results['genetic_algorithm'] = ga.optimize(warehouse_data, num_vehicles, verbose=False)
        except Exception as e:
            results['genetic_algorithm'] = {"error": str(e)}
        
        # 2. Simulated Annealing
        try:
            sa = SimulatedAnnealingTSP(
                initial_temperature=1000.0,
                cooling_rate=0.95
            )
            results['simulated_annealing'] = sa.optimize(warehouse_data, 0, use_2opt=True, verbose=False)
        except Exception as e:
            results['simulated_annealing'] = {"error": str(e)}
        
        # 3. 2-opt
        try:
            results['two_opt'] = TwoOptOptimizer.optimize(
                warehouse_data,
                initial_route=None,
                max_iterations=500,
                verbose=False
            )
        except Exception as e:
            results['two_opt'] = {"error": str(e)}
        
        # Comparación
        comparison = {
            "algorithms": results,
            "summary": {
                "best_algorithm": None,
                "best_distance": float('inf')
            }
        }
        
        # Encontrar el mejor
        for algo_name, algo_result in results.items():
            if 'error' not in algo_result:
                distance = algo_result.get('total_distance', float('inf'))
                if distance < comparison['summary']['best_distance']:
                    comparison['summary']['best_distance'] = distance
                    comparison['summary']['best_algorithm'] = algo_name
        
        return comparison
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
