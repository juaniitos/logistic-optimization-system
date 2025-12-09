"""
Algoritmo Genético para Optimización de Rutas de Vehículos (VRP)
Sistema de Optimización Logística - UPSE
"""

import random
import numpy as np
from typing import List, Tuple, Dict
from dataclasses import dataclass


@dataclass
class Route:
    """Representa una ruta de vehículo"""
    vehicle_id: int
    warehouses: List[int]
    total_distance: float
    total_load: float
    
    def __repr__(self):
        return f"Route(vehicle={self.vehicle_id}, warehouses={self.warehouses}, distance={self.total_distance:.2f}km)"


class GeneticAlgorithmVRP:
    """
    Algoritmo Genético para resolver el Vehicle Routing Problem (VRP)
    
    Parámetros:
    - population_size: Tamaño de la población
    - generations: Número de generaciones
    - mutation_rate: Tasa de mutación (0-1)
    - crossover_rate: Tasa de cruce (0-1)
    - elite_size: Tamaño de la élite a preservar
    """
    
    def __init__(
        self,
        population_size: int = 100,
        generations: int = 200,
        mutation_rate: float = 0.1,
        crossover_rate: float = 0.8,
        elite_size: int = 10
    ):
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.elite_size = elite_size
        self.best_fitness_history = []
        
    def calculate_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """Calcula distancia euclidiana entre dos puntos"""
        return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    def calculate_route_distance(self, route: List[int], distance_matrix: np.ndarray) -> float:
        """Calcula la distancia total de una ruta"""
        total_distance = 0
        for i in range(len(route) - 1):
            total_distance += distance_matrix[route[i]][route[i + 1]]
        # Agregar regreso al depósito (UPSE) si no está ya al final
        if route[-1] != 0:
            total_distance += distance_matrix[route[-1]][0]
        return total_distance
    
    def create_individual(self, num_warehouses: int, num_vehicles: int, depot: int = 0) -> List[List[int]]:
        """
        Crea un individuo (solución) aleatorio
        Un individuo es una lista de rutas, una por vehículo
        Todas las rutas inician y finalizan en el depósito (UPSE)
        """
        # Lista de bodegas a visitar (excluyendo el depósito)
        warehouses = [i for i in range(num_warehouses) if i != depot]
        random.shuffle(warehouses)
        
        # Dividir bodegas entre vehículos
        routes = []
        chunk_size = len(warehouses) // num_vehicles
        
        for i in range(num_vehicles):
            if i == num_vehicles - 1:
                # Último vehículo toma las restantes
                route = [depot] + warehouses[i * chunk_size:] + [depot]
            else:
                route = [depot] + warehouses[i * chunk_size:(i + 1) * chunk_size] + [depot]
            
            if len(route) > 2:  # Solo agregar rutas no vacías (debe tener al menos depot -> depot)
                routes.append(route)
        
        return routes
    
    def calculate_fitness(self, individual: List[List[int]], distance_matrix: np.ndarray) -> float:
        """
        Calcula el fitness de un individuo
        Fitness = 1 / distancia_total (maximizar fitness = minimizar distancia)
        """
        total_distance = sum(
            self.calculate_route_distance(route, distance_matrix) 
            for route in individual
        )
        return 1 / (total_distance + 1e-10)  # Evitar división por cero
    
    def create_initial_population(
        self, 
        num_warehouses: int, 
        num_vehicles: int, 
        depot: int = 0
    ) -> List[List[List[int]]]:
        """Crea la población inicial"""
        return [
            self.create_individual(num_warehouses, num_vehicles, depot)
            for _ in range(self.population_size)
        ]
    
    def selection(
        self, 
        population: List[List[List[int]]], 
        fitness_scores: List[float]
    ) -> List[List[int]]:
        """
        Selección por torneo
        Selecciona individuos basándose en su fitness
        """
        tournament_size = 5
        tournament_indices = random.sample(range(len(population)), tournament_size)
        tournament_fitness = [fitness_scores[i] for i in tournament_indices]
        winner_index = tournament_indices[tournament_fitness.index(max(tournament_fitness))]
        return population[winner_index]
    
    def crossover(
        self, 
        parent1: List[List[int]], 
        parent2: List[List[int]]
    ) -> Tuple[List[List[int]], List[List[int]]]:
        """
        Cruce de orden (Order Crossover - OX)
        Combina dos padres para crear dos hijos
        """
        if random.random() > self.crossover_rate:
            return parent1.copy(), parent2.copy()
        
        # Aplanar las rutas
        flat1 = [gene for route in parent1 for gene in route if gene != 0]
        flat2 = [gene for route in parent2 for gene in route if gene != 0]
        
        if len(flat1) < 2 or len(flat2) < 2:
            return parent1.copy(), parent2.copy()
        
        # Order Crossover
        size = min(len(flat1), len(flat2))
        point1, point2 = sorted(random.sample(range(size), 2))
        
        # Crear hijos
        child1 = [-1] * size
        child2 = [-1] * size
        
        # Copiar segmento
        child1[point1:point2] = flat1[point1:point2]
        child2[point1:point2] = flat2[point1:point2]
        
        # Llenar el resto
        def fill_child(child, parent):
            pos = point2
            for gene in parent:
                if gene not in child:
                    if pos >= size:
                        pos = 0
                    child[pos] = gene
                    pos += 1
            return child
        
        child1 = fill_child(child1, flat2)
        child2 = fill_child(child2, flat1)
        
        # Reconstruir rutas (depot al inicio y al final)
        num_routes = len(parent1)
        chunk_size = size // num_routes
        
        offspring1 = [[0] + child1[i*chunk_size:(i+1)*chunk_size] + [0] for i in range(num_routes) if i*chunk_size < size]
        offspring2 = [[0] + child2[i*chunk_size:(i+1)*chunk_size] + [0] for i in range(num_routes) if i*chunk_size < size]
        
        return offspring1, offspring2
    
    def mutate(self, individual: List[List[int]]) -> List[List[int]]:
        """
        Mutación por intercambio
        Intercambia dos genes aleatoriamente (excluyendo depot al inicio y final)
        """
        if random.random() > self.mutation_rate:
            return individual
        
        individual = [route.copy() for route in individual]
        
        # Seleccionar dos rutas aleatorias
        if len(individual) < 2:
            return individual
        
        route1_idx = random.randint(0, len(individual) - 1)
        route2_idx = random.randint(0, len(individual) - 1)
        
        route1 = individual[route1_idx]
        route2 = individual[route2_idx]
        
        # Intercambiar dos ciudades (excluyendo el depósito al inicio y final)
        if len(route1) > 3 and len(route2) > 3:  # Necesita al menos depot -> A -> depot
            pos1 = random.randint(1, len(route1) - 2)  # Excluye primer y último elemento (depot)
            pos2 = random.randint(1, len(route2) - 2)
            route1[pos1], route2[pos2] = route2[pos2], route1[pos1]
        
        return individual
    
    def optimize(
        self, 
        warehouses: List[Dict], 
        num_vehicles: int,
        verbose: bool = True
    ) -> Dict:
        """
        Ejecuta el algoritmo genético
        
        Args:
            warehouses: Lista de diccionarios con información de bodegas
                       Cada bodega debe tener 'latitude' y 'longitude'
            num_vehicles: Número de vehículos disponibles
            verbose: Si True, imprime el progreso
        
        Returns:
            Dict con la mejor solución encontrada
        """
        # Crear matriz de distancias
        num_warehouses = len(warehouses)
        distance_matrix = np.zeros((num_warehouses, num_warehouses))
        
        for i in range(num_warehouses):
            for j in range(num_warehouses):
                if i != j:
                    point1 = (warehouses[i]['latitude'], warehouses[i]['longitude'])
                    point2 = (warehouses[j]['latitude'], warehouses[j]['longitude'])
                    distance_matrix[i][j] = self.calculate_distance(point1, point2)
        
        # Crear población inicial
        population = self.create_initial_population(num_warehouses, num_vehicles)
        
        best_individual = None
        best_fitness = 0
        
        for generation in range(self.generations):
            # Calcular fitness
            fitness_scores = [
                self.calculate_fitness(individual, distance_matrix)
                for individual in population
            ]
            
            # Encontrar mejor individuo
            max_fitness_idx = fitness_scores.index(max(fitness_scores))
            if fitness_scores[max_fitness_idx] > best_fitness:
                best_fitness = fitness_scores[max_fitness_idx]
                best_individual = population[max_fitness_idx]
            
            self.best_fitness_history.append(best_fitness)
            
            if verbose and generation % 20 == 0:
                best_distance = 1 / best_fitness
                print(f"Generación {generation}: Mejor distancia = {best_distance:.2f} km")
            
            # Crear nueva población
            new_population = []
            
            # Elitismo: preservar los mejores
            elite_indices = sorted(
                range(len(fitness_scores)), 
                key=lambda i: fitness_scores[i], 
                reverse=True
            )[:self.elite_size]
            new_population.extend([population[i] for i in elite_indices])
            
            # Generar el resto de la población
            while len(new_population) < self.population_size:
                parent1 = self.selection(population, fitness_scores)
                parent2 = self.selection(population, fitness_scores)
                
                offspring1, offspring2 = self.crossover(parent1, parent2)
                
                offspring1 = self.mutate(offspring1)
                offspring2 = self.mutate(offspring2)
                
                new_population.extend([offspring1, offspring2])
            
            population = new_population[:self.population_size]
        
        # Calcular resultado final
        best_distance = 1 / best_fitness
        routes = []
        
        for vehicle_idx, route in enumerate(best_individual):
            route_distance = self.calculate_route_distance(route, distance_matrix)
            routes.append({
                'vehicle_id': vehicle_idx + 1,
                'warehouses': route,
                'warehouse_names': [warehouses[i]['name'] for i in route],
                'distance': round(route_distance, 2)
            })
        
        return {
            'algorithm': 'Genetic Algorithm',
            'total_distance': round(best_distance, 2),
            'num_vehicles': num_vehicles,
            'num_warehouses': num_warehouses,
            'generations': self.generations,
            'routes': routes,
            'convergence_history': self.best_fitness_history
        }
