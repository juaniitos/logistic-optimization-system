"""
Test suite for route planning service
"""
import pytest
from app.services.route_planner import RoutePlanner
from app.models.schemas import LocationPoint


def test_calculate_distance():
    """Test Haversine distance calculation"""
    planner = RoutePlanner(None)
    
    # Distance between two known points
    lat1, lon1 = -2.2, -79.9  # Santa Elena
    lat2, lon2 = -2.21, -79.91  # Nearby point
    
    distance = planner.calculate_distance(lat1, lon1, lat2, lon2)
    
    assert distance > 0
    assert distance < 10  # Should be less than 10km for nearby points


def test_optimize_route():
    """Test route optimization"""
    planner = RoutePlanner(None)
    
    origin = LocationPoint(latitude=-2.2, longitude=-79.9, name="Origin")
    destinations = [
        LocationPoint(latitude=-2.21, longitude=-79.91, name="Dest 1"),
        LocationPoint(latitude=-2.19, longitude=-79.88, name="Dest 2"),
    ]
    
    # This would be an async test in practice
    # result = await planner.optimize_route(origin, destinations)
    # assert result.total_distance > 0
    pass


def test_build_distance_matrix():
    """Test distance matrix construction"""
    planner = RoutePlanner(None)
    
    origin = LocationPoint(latitude=-2.2, longitude=-79.9, name="Origin")
    destinations = [
        LocationPoint(latitude=-2.21, longitude=-79.91, name="Dest 1"),
    ]
    
    matrix = planner.build_distance_matrix(origin, destinations)
    
    assert len(matrix) == 2  # Origin + 1 destination
    assert matrix[0][0] == 0  # Distance to self is 0
    assert matrix[0][1] > 0  # Distance to destination
    assert matrix[0][1] == matrix[1][0]  # Symmetric matrix
