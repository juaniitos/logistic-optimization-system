"""
Optimization algorithms for logistics
"""
import numpy as np
from typing import List, Tuple, Dict
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp


class VehicleRoutingOptimizer:
    """Vehicle Routing Problem (VRP) solver using OR-Tools"""
    
    def __init__(self, distance_matrix: List[List[float]], num_vehicles: int = 1):
        self.distance_matrix = distance_matrix
        self.num_vehicles = num_vehicles
        self.num_locations = len(distance_matrix)
    
    def create_data_model(
        self,
        vehicle_capacities: List[float] = None,
        demands: List[float] = None,
        depot: int = 0
    ) -> Dict:
        """Create data model for the solver"""
        data = {
            'distance_matrix': self.distance_matrix,
            'num_vehicles': self.num_vehicles,
            'depot': depot
        }
        
        if vehicle_capacities and demands:
            data['vehicle_capacities'] = vehicle_capacities
            data['demands'] = demands
        
        return data
    
    def solve(self, time_limit_seconds: int = 30) -> Dict:
        """
        Solve VRP problem
        
        Returns solution with routes and total distance
        """
        data = self.create_data_model()
        
        # Create routing index manager
        manager = pywrapcp.RoutingIndexManager(
            len(data['distance_matrix']),
            data['num_vehicles'],
            data['depot']
        )
        
        # Create routing model
        routing = pywrapcp.RoutingModel(manager)
        
        # Create distance callback
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return int(data['distance_matrix'][from_node][to_node] * 100)  # Scale to integer
        
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.time_limit.seconds = time_limit_seconds
        
        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)
        
        if solution:
            return self._extract_solution(manager, routing, solution)
        else:
            return None
    
    def _extract_solution(self, manager, routing, solution) -> Dict:
        """Extract solution from solver"""
        routes = []
        total_distance = 0
        
        for vehicle_id in range(self.num_vehicles):
            route = []
            index = routing.Start(vehicle_id)
            route_distance = 0
            
            while not routing.IsEnd(index):
                node = manager.IndexToNode(index)
                route.append(node)
                previous_index = index
                index = solution.Value(routing.NextVar(index))
                route_distance += routing.GetArcCostForVehicle(
                    previous_index, index, vehicle_id
                )
            
            route.append(manager.IndexToNode(index))
            routes.append({
                'vehicle_id': vehicle_id,
                'route': route,
                'distance': route_distance / 100  # Unscale
            })
            total_distance += route_distance
        
        return {
            'routes': routes,
            'total_distance': total_distance / 100,  # Unscale
            'num_vehicles_used': len([r for r in routes if len(r['route']) > 2])
        }


class InventoryOptimizer:
    """Inventory optimization algorithms"""
    
    @staticmethod
    def abc_analysis(
        items: List[Dict[str, float]],
        value_key: str = 'value'
    ) -> Dict[str, List[Dict]]:
        """
        Perform ABC analysis on inventory items
        
        A items: 80% of value (top ~20% of items)
        B items: 15% of value (next ~30% of items)
        C items: 5% of value (remaining ~50% of items)
        """
        # Sort items by value (descending)
        sorted_items = sorted(items, key=lambda x: x[value_key], reverse=True)
        
        total_value = sum(item[value_key] for item in sorted_items)
        cumulative_value = 0
        
        categories = {'A': [], 'B': [], 'C': []}
        
        for item in sorted_items:
            cumulative_value += item[value_key]
            percentage = (cumulative_value / total_value) * 100
            
            if percentage <= 80:
                categories['A'].append(item)
            elif percentage <= 95:
                categories['B'].append(item)
            else:
                categories['C'].append(item)
        
        return categories
    
    @staticmethod
    def optimize_safety_stock(
        avg_demand: float,
        demand_std: float,
        lead_time: float,
        service_level: float = 0.95
    ) -> float:
        """
        Calculate optimal safety stock level
        
        Safety Stock = Z × σ_demand × √lead_time
        """
        from scipy import stats
        
        # Z-score for desired service level
        z_score = stats.norm.ppf(service_level)
        
        safety_stock = z_score * demand_std * np.sqrt(lead_time)
        return safety_stock
