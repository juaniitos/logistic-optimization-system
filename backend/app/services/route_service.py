"""
Servicio para obtener rutas reales por carreteras usando OSRM
"""
import requests
from typing import List, Dict, Tuple, Optional
import math


class RouteService:
    """Servicio para calcular rutas reales por carreteras"""
    
    # OSRM Demo Server (puede ser lento, considera usar tu propio servidor)
    OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calcula la distancia haversine entre dos puntos (en km)
        Usado como fallback si OSRM falla
        """
        R = 6371  # Radio de la Tierra en kilómetros
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    @classmethod
    def get_route_geometry(
        cls, 
        coordinates: List[Tuple[float, float]], 
        timeout: int = 5
    ) -> Optional[Dict]:
        """
        Obtiene la geometría de ruta real usando OSRM
        
        Args:
            coordinates: Lista de tuplas (lat, lon)
            timeout: Timeout de la petición en segundos
            
        Returns:
            Dict con 'distance' (km), 'duration' (segundos), y 'geometry' (lista de coordenadas)
            None si falla
        """
        if len(coordinates) < 2:
            return None
        
        try:
            # OSRM usa formato lon,lat (no lat,lon!)
            coords_str = ";".join([f"{lon},{lat}" for lat, lon in coordinates])
            
            # Construir URL
            url = f"{cls.OSRM_BASE_URL}/{coords_str}"
            params = {
                "overview": "full",
                "geometries": "geojson",
                "steps": "false"
            }
            
            # Hacer petición
            response = requests.get(url, params=params, timeout=timeout)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("code") == "Ok" and data.get("routes"):
                    route = data["routes"][0]
                    
                    # Extraer geometría (GeoJSON coordinates)
                    geometry_coords = route.get("geometry", {}).get("coordinates", [])
                    
                    # Convertir de [lon, lat] a [lat, lon]
                    geometry = [[coord[1], coord[0]] for coord in geometry_coords]
                    
                    return {
                        "distance": route["distance"] / 1000,  # metros a km
                        "duration": route["duration"],  # segundos
                        "geometry": geometry
                    }
            
            return None
            
        except Exception as e:
            print(f"Error obteniendo ruta de OSRM: {e}")
            return None
    
    @classmethod
    def get_route_distance(
        cls, 
        coordinates: List[Tuple[float, float]],
        use_road_routing: bool = True
    ) -> float:
        """
        Calcula la distancia de una ruta
        
        Args:
            coordinates: Lista de tuplas (lat, lon)
            use_road_routing: Si True, intenta usar OSRM; si False o falla, usa haversine
            
        Returns:
            Distancia en kilómetros
        """
        if len(coordinates) < 2:
            return 0.0
        
        # Intentar usar OSRM si está habilitado
        if use_road_routing:
            route_data = cls.get_route_geometry(coordinates, timeout=3)
            if route_data:
                return route_data["distance"]
        
        # Fallback: calcular distancia haversine punto a punto
        total_distance = 0.0
        for i in range(len(coordinates) - 1):
            lat1, lon1 = coordinates[i]
            lat2, lon2 = coordinates[i + 1]
            total_distance += cls.haversine_distance(lat1, lon1, lat2, lon2)
        
        return total_distance
    
    @classmethod
    def get_route_with_geometry(
        cls,
        warehouse_indices: List[int],
        warehouses: List[Dict],
        use_road_routing: bool = True
    ) -> Dict:
        """
        Obtiene información completa de una ruta incluyendo geometría
        
        Args:
            warehouse_indices: Índices de las bodegas en la ruta
            warehouses: Lista de diccionarios con datos de bodegas (debe tener 'latitude' y 'longitude')
            use_road_routing: Si usar enrutamiento por carreteras
            
        Returns:
            Dict con 'distance', 'duration', 'geometry', 'warehouse_indices'
        """
        if not warehouse_indices or len(warehouse_indices) < 2:
            return {
                "distance": 0,
                "duration": 0,
                "geometry": [],
                "warehouse_indices": warehouse_indices
            }
        
        # Obtener coordenadas
        coordinates = []
        for idx in warehouse_indices:
            if 0 <= idx < len(warehouses):
                w = warehouses[idx]
                coordinates.append((w["latitude"], w["longitude"]))
        
        # Obtener ruta con geometría
        if use_road_routing:
            route_data = cls.get_route_geometry(coordinates, timeout=5)
            if route_data:
                return {
                    "distance": round(route_data["distance"], 2),
                    "duration": round(route_data["duration"], 0),
                    "geometry": route_data["geometry"],
                    "warehouse_indices": warehouse_indices
                }
        
        # Fallback: línea recta sin geometría detallada
        distance = cls.get_route_distance(coordinates, use_road_routing=False)
        
        # Estimar duración (40 km/h promedio)
        duration = (distance / 40) * 3600  # segundos
        
        return {
            "distance": round(distance, 2),
            "duration": round(duration, 0),
            "geometry": [[w["latitude"], w["longitude"]] for w in 
                        [warehouses[idx] for idx in warehouse_indices if 0 <= idx < len(warehouses)]],
            "warehouse_indices": warehouse_indices
        }
