"""
Route planning and optimization service
"""
import math
import networkx as nx
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.schemas import LocationPoint, RouteOptimizationResponse, RouteSegment


class RoutePlanner:
    """Service for route optimization and planning"""
    
    def __init__(self, db: Session):
        self.db = db
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
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
    
    def build_distance_matrix(
        self,
        origin: LocationPoint,
        destinations: List[LocationPoint]
    ) -> List[List[float]]:
        """Build distance matrix for all locations"""
        all_locations = [origin] + destinations
        n = len(all_locations)
        matrix = [[0.0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(i + 1, n):
                dist = self.calculate_distance(
                    all_locations[i].latitude,
                    all_locations[i].longitude,
                    all_locations[j].latitude,
                    all_locations[j].longitude
                )
                matrix[i][j] = dist
                matrix[j][i] = dist
        
        return matrix
    
    def nearest_neighbor_tsp(
        self,
        distance_matrix: List[List[float]],
        start_idx: int = 0
    ) -> Tuple[List[int], float]:
        """
        Solve TSP using Nearest Neighbor heuristic
        Returns: (route_indices, total_distance)
        """
        n = len(distance_matrix)
        unvisited = set(range(n))
        current = start_idx
        route = [current]
        unvisited.remove(current)
        total_distance = 0.0
        
        while unvisited:
            nearest = min(unvisited, key=lambda x: distance_matrix[current][x])
            total_distance += distance_matrix[current][nearest]
            current = nearest
            route.append(current)
            unvisited.remove(current)
        
        # Return to origin
        total_distance += distance_matrix[current][start_idx]
        route.append(start_idx)
        
        return route, total_distance
    
    async def optimize_route(
        self,
        origin: LocationPoint,
        destinations: List[LocationPoint],
        vehicle_id: Optional[int] = None,
        max_distance: Optional[float] = None,
        max_time: Optional[float] = None
    ) -> RouteOptimizationResponse:
        """
        Optimize route for multiple destinations
        """
        if not destinations:
            raise ValueError("At least one destination is required")
        
        # Build distance matrix
        distance_matrix = self.build_distance_matrix(origin, destinations)
        
        # Solve TSP using nearest neighbor
        route_indices, total_distance = self.nearest_neighbor_tsp(distance_matrix)
        
        # Build location list with origin and destinations
        all_locations = [origin] + destinations
        
        # Create optimized sequence
        optimized_sequence = []
        route_segments = []
        
        for i in range(len(route_indices) - 1):
            from_idx = route_indices[i]
            to_idx = route_indices[i + 1]
            
            from_loc = all_locations[from_idx]
            to_loc = all_locations[to_idx]
            
            from_name = from_loc.name or f"Location {from_idx}"
            to_name = to_loc.name or f"Location {to_idx}"
            
            optimized_sequence.append(from_name)
            
            segment_distance = distance_matrix[from_idx][to_idx]
            segment_time = segment_distance / 50  # Assuming 50 km/h average speed
            
            route_segments.append(RouteSegment(
                from_location=from_name,
                to_location=to_name,
                distance=round(segment_distance, 2),
                time=round(segment_time, 2)
            ))
        
        # Calculate totals
        total_time = total_distance / 50  # Average speed 50 km/h
        fuel_cost_per_km = 0.5  # Example: $0.5 per km
        total_cost = total_distance * fuel_cost_per_km
        
        return RouteOptimizationResponse(
            total_distance=round(total_distance, 2),
            total_time=round(total_time, 2),
            total_cost=round(total_cost, 2),
            optimized_sequence=optimized_sequence,
            route_segments=route_segments
        )
