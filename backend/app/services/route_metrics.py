"""
Cálculo de Métricas para Optimización de Rutas
Sistema de Optimización Logística - UPSE
"""

import numpy as np
from typing import List, Dict, Tuple


class RouteMetricsCalculator:
    """
    Calcula métricas avanzadas para rutas optimizadas:
    - Emisiones de CO2 (contaminación)
    - Tiempo estimado de entrega
    - Ahorro de combustible y recursos
    """
    
    # Constantes
    AVG_SPEED_KM_H = 40  # Velocidad promedio en ciudad (km/h)
    CO2_PER_KM = 0.12  # kg CO2 por km (vehículo promedio)
    FUEL_CONSUMPTION_PER_KM = 0.08  # litros por km
    FUEL_COST_PER_LITER = 2.5  # USD por litro
    TIME_PER_STOP_MINUTES = 15  # Tiempo promedio por parada
    OPERATION_COST_PER_HOUR = 8.0  # USD por hora operativa
    MAINTENANCE_COST_PER_KM = 0.18  # USD por km recorrido
    CARBON_COST_PER_KG = 0.05  # USD por kg CO2 estimado
    
    @staticmethod
    def calculate_emissions(distance_km: float) -> Dict[str, float]:
        """
        Calcula emisiones de CO2 basado en la distancia
        
        Returns:
            Dict con total_co2_kg y classification
        """
        co2_kg = distance_km * RouteMetricsCalculator.CO2_PER_KM
        
        # Clasificación de nivel de contaminación
        if co2_kg < 10:
            classification = "Bajo"
            percentage = 25
        elif co2_kg < 25:
            classification = "Medio"
            percentage = 50
        elif co2_kg < 50:
            classification = "Alto"
            percentage = 75
        else:
            classification = "Muy Alto"
            percentage = 100
            
        return {
            "total_co2_kg": round(co2_kg, 2),
            "co2_per_km": RouteMetricsCalculator.CO2_PER_KM,
            "pollution_level": classification,
            "pollution_percentage": percentage
        }
    
    @staticmethod
    def calculate_time(distance_km: float, num_stops: int) -> Dict[str, float]:
        """
        Calcula tiempo estimado de entrega
        
        Returns:
            Dict con total_minutes, driving_time, stop_time
        """
        driving_time_hours = distance_km / RouteMetricsCalculator.AVG_SPEED_KM_H
        driving_time_minutes = driving_time_hours * 60
        
        stop_time_minutes = num_stops * RouteMetricsCalculator.TIME_PER_STOP_MINUTES
        
        total_minutes = driving_time_minutes + stop_time_minutes
        total_hours = total_minutes / 60
        
        return {
            "total_minutes": round(total_minutes, 2),
            "total_hours": round(total_hours, 2),
            "driving_time_minutes": round(driving_time_minutes, 2),
            "stop_time_minutes": stop_time_minutes,
            "avg_speed_km_h": RouteMetricsCalculator.AVG_SPEED_KM_H,
            "num_stops": num_stops
        }
    
    @staticmethod
    def calculate_fuel_cost(distance_km: float) -> Dict[str, float]:
        """
        Calcula consumo de combustible y costo
        
        Returns:
            Dict con fuel_liters, fuel_cost, cost_per_km
        """
        fuel_liters = distance_km * RouteMetricsCalculator.FUEL_CONSUMPTION_PER_KM
        fuel_cost = fuel_liters * RouteMetricsCalculator.FUEL_COST_PER_LITER
        cost_per_km = fuel_cost / distance_km if distance_km > 0 else 0
        
        return {
            "fuel_liters": round(fuel_liters, 2),
            "fuel_cost_usd": round(fuel_cost, 2),
            "cost_per_km": round(cost_per_km, 2),
            "fuel_consumption_per_km": RouteMetricsCalculator.FUEL_CONSUMPTION_PER_KM,
            "fuel_price_per_liter": RouteMetricsCalculator.FUEL_COST_PER_LITER
        }

    @staticmethod
    def calculate_monetary_value(distance_km: float, num_stops: int) -> Dict[str, float]:
        """
        Monetiza las variables operativas de la ruta en USD.
        """
        fuel = RouteMetricsCalculator.calculate_fuel_cost(distance_km)
        time = RouteMetricsCalculator.calculate_time(distance_km, num_stops)
        emissions = RouteMetricsCalculator.calculate_emissions(distance_km)

        fuel_cost = fuel["fuel_cost_usd"]
        time_cost = time["total_hours"] * RouteMetricsCalculator.OPERATION_COST_PER_HOUR
        maintenance_cost = distance_km * RouteMetricsCalculator.MAINTENANCE_COST_PER_KM
        environmental_cost = emissions["total_co2_kg"] * RouteMetricsCalculator.CARBON_COST_PER_KG
        total_cost = fuel_cost + time_cost + maintenance_cost + environmental_cost

        return {
            "fuel_cost_usd": round(fuel_cost, 2),
            "time_cost_usd": round(time_cost, 2),
            "maintenance_cost_usd": round(maintenance_cost, 2),
            "environmental_cost_usd": round(environmental_cost, 2),
            "total_operational_cost_usd": round(total_cost, 2),
            "operation_cost_per_hour": RouteMetricsCalculator.OPERATION_COST_PER_HOUR,
            "maintenance_cost_per_km": RouteMetricsCalculator.MAINTENANCE_COST_PER_KM,
            "carbon_cost_per_kg": RouteMetricsCalculator.CARBON_COST_PER_KG
        }
    
    @staticmethod
    def calculate_savings(
        optimized_distance: float,
        baseline_distance: float,
        num_stops: int
    ) -> Dict[str, float]:
        """
        Calcula ahorros comparando con una ruta no optimizada
        
        Args:
            optimized_distance: Distancia de la ruta optimizada (km)
            baseline_distance: Distancia de la ruta sin optimizar (km)
            num_stops: Número de paradas
            
        Returns:
            Dict con ahorros en distancia, tiempo, combustible, CO2 y dinero
        """
        # Calcular métricas para ambas rutas
        opt_emissions = RouteMetricsCalculator.calculate_emissions(optimized_distance)
        base_emissions = RouteMetricsCalculator.calculate_emissions(baseline_distance)
        
        opt_fuel = RouteMetricsCalculator.calculate_fuel_cost(optimized_distance)
        base_fuel = RouteMetricsCalculator.calculate_fuel_cost(baseline_distance)
        
        opt_time = RouteMetricsCalculator.calculate_time(optimized_distance, num_stops)
        base_time = RouteMetricsCalculator.calculate_time(baseline_distance, num_stops)
        opt_money = RouteMetricsCalculator.calculate_monetary_value(optimized_distance, num_stops)
        base_money = RouteMetricsCalculator.calculate_monetary_value(baseline_distance, num_stops)
        
        # Calcular ahorros
        distance_saved_km = baseline_distance - optimized_distance
        distance_saved_percent = (distance_saved_km / baseline_distance * 100) if baseline_distance > 0 else 0
        
        co2_saved_kg = base_emissions["total_co2_kg"] - opt_emissions["total_co2_kg"]
        co2_saved_percent = (co2_saved_kg / base_emissions["total_co2_kg"] * 100) if base_emissions["total_co2_kg"] > 0 else 0
        
        fuel_saved_liters = base_fuel["fuel_liters"] - opt_fuel["fuel_liters"]
        fuel_saved_percent = (fuel_saved_liters / base_fuel["fuel_liters"] * 100) if base_fuel["fuel_liters"] > 0 else 0
        
        cost_saved_usd = base_fuel["fuel_cost_usd"] - opt_fuel["fuel_cost_usd"]
        cost_saved_percent = (cost_saved_usd / base_fuel["fuel_cost_usd"] * 100) if base_fuel["fuel_cost_usd"] > 0 else 0
        
        time_saved_minutes = base_time["driving_time_minutes"] - opt_time["driving_time_minutes"]
        time_saved_hours = time_saved_minutes / 60
        time_saved_percent = (time_saved_minutes / base_time["driving_time_minutes"] * 100) if base_time["driving_time_minutes"] > 0 else 0
        time_saved_usd = base_money["time_cost_usd"] - opt_money["time_cost_usd"]
        maintenance_saved_usd = base_money["maintenance_cost_usd"] - opt_money["maintenance_cost_usd"]
        environmental_saved_usd = base_money["environmental_cost_usd"] - opt_money["environmental_cost_usd"]
        total_saved_usd = base_money["total_operational_cost_usd"] - opt_money["total_operational_cost_usd"]
        
        return {
            "distance_saved_km": round(distance_saved_km, 2),
            "distance_saved_percent": round(distance_saved_percent, 2),
            "co2_saved_kg": round(co2_saved_kg, 2),
            "co2_saved_percent": round(co2_saved_percent, 2),
            "fuel_saved_liters": round(fuel_saved_liters, 2),
            "fuel_saved_percent": round(fuel_saved_percent, 2),
            "cost_saved_usd": round(cost_saved_usd, 2),
            "cost_saved_percent": round(cost_saved_percent, 2),
            "time_saved_minutes": round(time_saved_minutes, 2),
            "time_saved_hours": round(time_saved_hours, 2),
            "time_saved_percent": round(time_saved_percent, 2),
            "time_saved_usd": round(time_saved_usd, 2),
            "maintenance_saved_usd": round(maintenance_saved_usd, 2),
            "environmental_saved_usd": round(environmental_saved_usd, 2),
            "total_saved_usd": round(total_saved_usd, 2)
        }
    
    @staticmethod
    def calculate_complete_metrics(
        distance_km: float,
        num_stops: int,
        baseline_distance: float = None
    ) -> Dict:
        """
        Calcula todas las métricas para una ruta
        
        Args:
            distance_km: Distancia total de la ruta optimizada
            num_stops: Número de paradas en la ruta
            baseline_distance: Distancia sin optimizar (opcional)
            
        Returns:
            Dict completo con todas las métricas
        """
        metrics = {
            "distance_km": round(distance_km, 2),
            "num_stops": num_stops,
            "emissions": RouteMetricsCalculator.calculate_emissions(distance_km),
            "time": RouteMetricsCalculator.calculate_time(distance_km, num_stops),
            "fuel": RouteMetricsCalculator.calculate_fuel_cost(distance_km),
            "monetary": RouteMetricsCalculator.calculate_monetary_value(distance_km, num_stops)
        }
        
        # Si hay baseline real, usarlo. Si no hay mejora, el ahorro debe ser 0.
        if baseline_distance is not None:
            effective_baseline = max(baseline_distance, distance_km)
            metrics["savings"] = RouteMetricsCalculator.calculate_savings(
                distance_km,
                effective_baseline,
                num_stops
            )
        else:
            # Usar heurística: baseline = distancia actual * 1.3 (30% más ineficiente)
            estimated_baseline = distance_km * 1.3
            metrics["savings"] = RouteMetricsCalculator.calculate_savings(
                distance_km,
                estimated_baseline,
                num_stops
            )
        
        return metrics
    
    @staticmethod
    def calculate_multi_vehicle_metrics(
        routes: List[Dict],
        baseline_total_distance: float = None
    ) -> Dict:
        """
        Calcula métricas agregadas para múltiples vehículos
        
        Args:
            routes: Lista de rutas con distance y num_stops
            baseline_total_distance: Distancia total sin optimizar (opcional)
            
        Returns:
            Dict con métricas agregadas y por vehículo
        """
        total_distance = sum(route.get("distance", 0) for route in routes)
        total_stops = sum(route.get("num_stops", 0) for route in routes)
        
        # Calcular baseline si no se proporciona
        if not baseline_total_distance:
            baseline_total_distance = total_distance * 1.3
        
        # Métricas agregadas
        aggregate_metrics = RouteMetricsCalculator.calculate_complete_metrics(
            total_distance,
            total_stops,
            baseline_total_distance
        )
        
        # Métricas por vehículo
        vehicle_metrics = []
        for i, route in enumerate(routes):
            distance = route.get("distance", 0)
            stops = route.get("num_stops", len(route.get("warehouses", [])) - 1)
            
            vehicle_metric = {
                "vehicle_id": i + 1,
                "distance_km": round(distance, 2),
                "num_stops": stops,
                **RouteMetricsCalculator.calculate_complete_metrics(distance, stops)
            }
            vehicle_metrics.append(vehicle_metric)
        
        return {
            "total_vehicles": len(routes),
            "aggregate": aggregate_metrics,
            "by_vehicle": vehicle_metrics
        }
