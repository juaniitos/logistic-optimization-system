"""
Simulated Annealing para Optimización de Rutas
Sistema de Optimización Logística - UPSE
"""

import random
import math
import numpy as np
from typing import List, Tuple, Dict


class SimulatedAnnealingTSP:
    """
    Simulated Annealing para el Traveling Salesman Problem (TSP)
    
    Parámetros:
    - initial_temperature: Temperatura inicial
    - cooling_rate: Tasa de enfriamiento (0-1)
    - min_temperature: Temperatura mínima
    - max_iterations: Máximo de iteraciones por temperatura
    """
    
    def __init__(
        self,
        initial_temperature: float = 1000.0,
        cooling_rate: float = 0.95,
        min_temperature: float = 1.0,
        max_iterations: int = 100
    ):
        self.initial_temperature = initial_temperature
        self.cooling_rate = cooling_rate
        self.min_temperature = min_temperature
        self.max_iterations = max_iterations
        self.temperature_history = []
        self.cost_history = []
        
    def calculate_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """Calcula distancia euclidiana entre dos puntos"""
        return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    def calculate_total_distance(self, route: List[int], distance_matrix: np.ndarray) -> float:
        """Calcula la distancia total de una ruta"""
        total_distance = 0
        for i in range(len(route)):
            j = (i + 1) % len(route)
            total_distance += distance_matrix[route[i]][route[j]]
        return total_distance
    
    def get_neighbor(self, route: List[int], depot_idx: int = 0) -> List[int]:
        """
        Genera una solución vecina intercambiando dos ciudades
        Mantiene el depósito fijo al inicio y final
        """
        new_route = route.copy()
        # Solo intercambiar posiciones intermedias (excluyendo depósito al inicio y final)
        valid_positions = [i for i in range(1, len(route) - 1) if route[i] != depot_idx]
        if len(valid_positions) >= 2:
            i, j = random.sample(valid_positions, 2)
            new_route[i], new_route[j] = new_route[j], new_route[i]
        return new_route
    
    def get_neighbor_2opt(self, route: List[int], depot_idx: int = 0) -> List[int]:
        """
        Genera una solución vecina usando 2-opt
        Invierte un segmento de la ruta (mantiene depósito al inicio y final)
        """
        new_route = route.copy()
        # Solo invertir segmentos intermedios (excluyendo depósito al inicio y final)
        if len(route) > 3:  # Necesita al menos depot -> A -> B -> depot
            i, j = sorted(random.sample(range(1, len(route) - 1), 2))
            new_route[i:j+1] = list(reversed(new_route[i:j+1]))
        return new_route
    
    def acceptance_probability(self, current_cost: float, new_cost: float, temperature: float) -> float:
        """
        Calcula la probabilidad de aceptar una solución peor
        """
        if new_cost < current_cost:
            return 1.0
        return math.exp((current_cost - new_cost) / temperature)
    
    def optimize(
        self,
        warehouses: List[Dict],
        start_warehouse: int = 0,
        use_2opt: bool = True,
        verbose: bool = True
    ) -> Dict:
        """
        Ejecuta el algoritmo de Simulated Annealing
        
        Args:
            warehouses: Lista de diccionarios con información de bodegas
            start_warehouse: Índice de la bodega inicial
            use_2opt: Si True, usa 2-opt para generar vecinos
            verbose: Si True, imprime el progreso
        
        Returns:
            Dict con la mejor solución encontrada
        """
        num_warehouses = len(warehouses)
        
        # Crear matriz de distancias
        distance_matrix = np.zeros((num_warehouses, num_warehouses))
        for i in range(num_warehouses):
            for j in range(num_warehouses):
                if i != j:
                    point1 = (warehouses[i]['latitude'], warehouses[i]['longitude'])
                    point2 = (warehouses[j]['latitude'], warehouses[j]['longitude'])
                    distance_matrix[i][j] = self.calculate_distance(point1, point2)
        
        # Solución inicial: ruta aleatoria que inicia y termina en el depósito (UPSE)
        warehouses_to_visit = [i for i in range(num_warehouses) if i != start_warehouse]
        random.shuffle(warehouses_to_visit)
        
        # Ruta: depot -> bodegas -> depot
        current_route = [start_warehouse] + warehouses_to_visit + [start_warehouse]
        
        current_cost = self.calculate_total_distance(current_route, distance_matrix)
        best_route = current_route.copy()
        best_cost = current_cost
        
        temperature = self.initial_temperature
        iteration = 0
        
        while temperature > self.min_temperature:
            for _ in range(self.max_iterations):
                # Generar vecino (manteniendo depósito al inicio y final)
                if use_2opt:
                    new_route = self.get_neighbor_2opt(current_route, start_warehouse)
                else:
                    new_route = self.get_neighbor(current_route, start_warehouse)
                
                new_cost = self.calculate_total_distance(new_route, distance_matrix)
                
                # Decidir si aceptar la nueva solución
                ap = self.acceptance_probability(current_cost, new_cost, temperature)
                
                if random.random() < ap:
                    current_route = new_route
                    current_cost = new_cost
                    
                    # Actualizar mejor solución
                    if current_cost < best_cost:
                        best_route = current_route.copy()
                        best_cost = current_cost
                
                iteration += 1
            
            # Enfriar
            self.temperature_history.append(temperature)
            self.cost_history.append(best_cost)
            
            if verbose and len(self.temperature_history) % 10 == 0:
                print(f"Iteración {iteration}: T={temperature:.2f}, Mejor distancia={best_cost:.2f} km")
            
            temperature *= self.cooling_rate
        
        # Preparar resultado
        return {
            'algorithm': 'Simulated Annealing',
            'route': best_route,
            'warehouse_names': [warehouses[i]['name'] for i in best_route],
            'total_distance': round(best_cost, 2),
            'iterations': iteration,
            'initial_temperature': self.initial_temperature,
            'final_temperature': temperature,
            'cooling_rate': self.cooling_rate,
            'convergence_history': {
                'temperatures': self.temperature_history,
                'costs': self.cost_history
            }
        }


class TwoOptOptimizer:
    """
    Algoritmo 2-opt para mejorar rutas TSP
    """
    
    @staticmethod
    def calculate_distance(point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """Calcula distancia euclidiana entre dos puntos"""
        return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    @staticmethod
    def calculate_total_distance(route: List[int], distance_matrix: np.ndarray) -> float:
        """Calcula la distancia total de una ruta"""
        total_distance = 0
        for i in range(len(route)):
            j = (i + 1) % len(route)
            total_distance += distance_matrix[route[i]][route[j]]
        return total_distance
    
    @staticmethod
    def two_opt_swap(route: List[int], i: int, k: int) -> List[int]:
        """
        Realiza un intercambio 2-opt
        Invierte el segmento de la ruta entre i y k
        """
        new_route = route[:i] + route[i:k+1][::-1] + route[k+1:]
        return new_route
    
    @staticmethod
    def optimize(
        warehouses: List[Dict],
        initial_route: List[int] = None,
        max_iterations: int = 1000,
        verbose: bool = True
    ) -> Dict:
        """
        Optimiza una ruta usando el algoritmo 2-opt
        
        Args:
            warehouses: Lista de diccionarios con información de bodegas
            initial_route: Ruta inicial (si es None, se genera aleatoriamente)
            max_iterations: Máximo de iteraciones sin mejora
            verbose: Si True, imprime el progreso
        
        Returns:
            Dict con la ruta optimizada
        """
        num_warehouses = len(warehouses)
        
        # Crear matriz de distancias
        distance_matrix = np.zeros((num_warehouses, num_warehouses))
        for i in range(num_warehouses):
            for j in range(num_warehouses):
                if i != j:
                    point1 = (warehouses[i]['latitude'], warehouses[i]['longitude'])
                    point2 = (warehouses[j]['latitude'], warehouses[j]['longitude'])
                    distance_matrix[i][j] = TwoOptOptimizer.calculate_distance(point1, point2)
        
        # Ruta inicial: siempre inicia y termina en depósito (índice 0)
        if initial_route is None:
            warehouses_to_visit = list(range(1, num_warehouses))  # Excluir depósito
            random.shuffle(warehouses_to_visit)
            route = [0] + warehouses_to_visit + [0]  # Depot al inicio y final
        else:
            route = initial_route.copy()
            # Asegurar que tenga depot al inicio y final
            if route[0] != 0:
                route.insert(0, 0)
            if route[-1] != 0:
                route.append(0)
        
        best_distance = TwoOptOptimizer.calculate_total_distance(route, distance_matrix)
        improvement = True
        iterations = 0
        iterations_without_improvement = 0
        
        while improvement and iterations_without_improvement < max_iterations:
            improvement = False
            iterations += 1
            
            # Mantener depot fijo al inicio (pos 0) y final (pos len-1)
            for i in range(1, len(route) - 2):  # Excluir depósito inicial
                for k in range(i + 1, len(route) - 1):  # Excluir depósito final
                    new_route = TwoOptOptimizer.two_opt_swap(route, i, k)
                    new_distance = TwoOptOptimizer.calculate_total_distance(new_route, distance_matrix)
                    
                    if new_distance < best_distance:
                        route = new_route
                        best_distance = new_distance
                        improvement = True
                        iterations_without_improvement = 0
                        
                        if verbose and iterations % 10 == 0:
                            print(f"Iteración {iterations}: Mejor distancia = {best_distance:.2f} km")
                        break
                
                if improvement:
                    break
            
            if not improvement:
                iterations_without_improvement += 1
        
        return {
            'algorithm': '2-opt',
            'route': route,
            'warehouse_names': [warehouses[i]['name'] for i in route],
            'total_distance': round(best_distance, 2),
            'iterations': iterations,
            'optimized': iterations_without_improvement >= max_iterations
        }
