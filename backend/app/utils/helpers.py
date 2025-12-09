"""
Utility functions and helpers
"""
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great circle distance between two points on Earth
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return distance


def generate_date_range(start_date: datetime, days: int) -> List[datetime]:
    """Generate list of dates from start_date for specified number of days"""
    return [start_date + timedelta(days=i) for i in range(days)]


def calculate_percentage_change(old_value: float, new_value: float) -> float:
    """Calculate percentage change between two values"""
    if old_value == 0:
        return 0.0 if new_value == 0 else 100.0
    return ((new_value - old_value) / old_value) * 100


def format_currency(amount: float, currency: str = "USD") -> str:
    """Format amount as currency string"""
    return f"{currency} {amount:,.2f}"


def validate_coordinates(latitude: float, longitude: float) -> bool:
    """Validate if coordinates are within valid ranges"""
    return -90 <= latitude <= 90 and -180 <= longitude <= 180


def calculate_route_metrics(
    distance_km: float,
    avg_speed_kmh: float = 50,
    fuel_consumption_per_km: float = 0.1,
    fuel_price: float = 1.5
) -> Dict[str, float]:
    """
    Calculate various metrics for a route
    
    Returns:
        - estimated_time_hours
        - fuel_needed_liters
        - fuel_cost
        - total_cost (including fixed costs)
    """
    estimated_time = distance_km / avg_speed_kmh
    fuel_needed = distance_km * fuel_consumption_per_km
    fuel_cost = fuel_needed * fuel_price
    driver_cost = estimated_time * 15  # $15 per hour for driver
    total_cost = fuel_cost + driver_cost
    
    return {
        "estimated_time_hours": round(estimated_time, 2),
        "fuel_needed_liters": round(fuel_needed, 2),
        "fuel_cost": round(fuel_cost, 2),
        "driver_cost": round(driver_cost, 2),
        "total_cost": round(total_cost, 2)
    }
