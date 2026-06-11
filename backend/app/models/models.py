"""
Database models for the logistic optimization system
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.database import Base
import enum


class WarehouseType(str, enum.Enum):
    """Tipo de bodega/punto"""
    ORIGIN = "origin"  # Punto de origen/salida
    DESTINATION = "destination"  # Punto de llegada/destino
    WAREHOUSE = "warehouse"  # Bodega intermedia


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Driver(Base):
    """Driver/Transporter model - Modelo de Transportista"""
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    # Datos personales
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    id_number = Column(String(20), unique=True, nullable=False)  # Cédula/DNI
    phone = Column(String(20))
    email = Column(String(255))
    address = Column(String(500))
    
    # Datos de licencia
    license_number = Column(String(50), unique=True, nullable=False)
    license_type = Column(String(20))  # Tipo de licencia (A, B, C, etc.)
    license_expiry = Column(DateTime(timezone=True))
    
    # Estado y disponibilidad
    status = Column(String(50), default="available")  # available, on_route, off_duty, inactive
    is_active = Column(Boolean, default=True)
    
    # Vehículo asignado (opcional)
    assigned_vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    assigned_vehicle = relationship("Vehicle", back_populates="assigned_driver")
    route_assignments = relationship("RouteAssignment", back_populates="driver")


class Warehouse(Base):
    """Warehouse model - Incluye puntos de origen, destino y bodegas"""
    __tablename__ = "warehouses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(500))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Float)  # Total capacity in cubic meters
    
    # Tipo de punto: origin, destination, warehouse
    location_type = Column(String(50), default="warehouse")
    
    # Información de contacto del punto
    contact_name = Column(String(255))
    contact_phone = Column(String(20))
    
    # Horarios de operación
    opening_time = Column(String(10))  # Formato HH:MM
    closing_time = Column(String(10))  # Formato HH:MM
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="warehouse")


class Product(Base):
    """Product model"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    unit_price = Column(Float, nullable=False)
    weight = Column(Float)  # Weight in kg
    volume = Column(Float)  # Volume in cubic meters
    category = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="product")


class InventoryItem(Base):
    """Inventory item model"""
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    min_stock = Column(Integer, default=10)
    max_stock = Column(Integer, default=1000)
    reorder_point = Column(Integer, default=20)
    is_active = Column(Boolean, default=True)
    last_restock_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    warehouse = relationship("Warehouse", back_populates="inventory_items")
    product = relationship("Product", back_populates="inventory_items")


class Vehicle(Base):
    """Vehicle model"""
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    plate = Column(String(50), unique=True, nullable=False)
    vehicle_type = Column(String(100))  # Truck, Van, Motorcycle, etc.
    capacity = Column(Float, nullable=False)  # Capacity in cubic meters
    max_weight = Column(Float)  # Max weight in kg
    fuel_consumption = Column(Float)  # Liters per km
    status = Column(String(50), default="available")  # available, in_use, maintenance
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    routes = relationship("Route", back_populates="vehicle")
    assigned_driver = relationship("Driver", back_populates="assigned_vehicle", uselist=False)


class Route(Base):
    """Route model"""
    __tablename__ = "routes"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    origin_warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    route_name = Column(String(255))
    total_distance = Column(Float)  # Distance in km
    estimated_time = Column(Float)  # Time in hours
    total_cost = Column(Float)
    status = Column(String(50), default="planned")  # planned, in_progress, completed
    route_data = Column(Text)  # JSON with detailed route information
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="routes")
    assignments = relationship("RouteAssignment", back_populates="route")


class Demand(Base):
    """Demand forecast model"""
    __tablename__ = "demands"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    forecast_date = Column(DateTime(timezone=True), nullable=False)
    predicted_quantity = Column(Float, nullable=False)
    actual_quantity = Column(Float)
    confidence_interval_lower = Column(Float)
    confidence_interval_upper = Column(Float)
    model_version = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RouteAssignment(Base):
    """Asignación de rutas a transportistas"""
    __tablename__ = "route_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=True)
    inventory_quantity = Column(Integer, nullable=True)
    inventory_dispatched = Column(Boolean, default=False)
    
    # Estado de la asignación
    status = Column(String(50), default="assigned")  # assigned, in_progress, completed, cancelled
    
    # Fechas
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Notas
    notes = Column(Text)
    
    # Relationships
    route = relationship("Route", back_populates="assignments")
    driver = relationship("Driver", back_populates="route_assignments")
    vehicle = relationship("Vehicle")
    inventory_item = relationship("InventoryItem")
