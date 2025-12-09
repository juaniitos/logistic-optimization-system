"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Warehouse Schemas
class WarehouseBase(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    capacity: Optional[float] = None
    location_type: str = "warehouse"  # origin, destination, warehouse
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    capacity: Optional[float] = None
    location_type: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None


class WarehouseResponse(WarehouseBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Driver/Transportista Schemas
class DriverBase(BaseModel):
    first_name: str
    last_name: str
    id_number: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    license_number: str
    license_type: Optional[str] = None
    license_expiry: Optional[datetime] = None
    status: str = "available"
    is_active: bool = True
    assigned_vehicle_id: Optional[int] = None


class DriverCreate(DriverBase):
    pass


class DriverUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    license_type: Optional[str] = None
    license_expiry: Optional[datetime] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    assigned_vehicle_id: Optional[int] = None


class DriverResponse(DriverBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Route Assignment Schemas
class RouteAssignmentBase(BaseModel):
    route_id: int
    driver_id: int
    vehicle_id: Optional[int] = None
    notes: Optional[str] = None


class RouteAssignmentCreate(RouteAssignmentBase):
    pass


class RouteAssignmentUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class RouteAssignmentResponse(RouteAssignmentBase):
    id: int
    status: str
    assigned_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Product Schemas
class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    unit_price: float
    weight: Optional[float] = None
    volume: Optional[float] = None
    category: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Inventory Schemas
class InventoryItemBase(BaseModel):
    warehouse_id: int
    product_id: int
    quantity: int
    min_stock: int = 10
    max_stock: int = 1000
    reorder_point: int = 20


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemResponse(InventoryItemBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Vehicle Schemas
class VehicleBase(BaseModel):
    plate: str
    vehicle_type: str
    capacity: float
    max_weight: Optional[float] = None
    fuel_consumption: Optional[float] = None
    status: str = "available"


class VehicleCreate(VehicleBase):
    pass


class VehicleResponse(VehicleBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Route Optimization Schemas
class LocationPoint(BaseModel):
    latitude: float
    longitude: float
    name: Optional[str] = None


class RouteOptimizationRequest(BaseModel):
    origin: LocationPoint
    destinations: List[LocationPoint]
    vehicle_id: Optional[int] = None
    max_distance: Optional[float] = None
    max_time: Optional[float] = None


class RouteSegment(BaseModel):
    from_location: str
    to_location: str
    distance: float
    time: float


class RouteOptimizationResponse(BaseModel):
    total_distance: float
    total_time: float
    total_cost: float
    optimized_sequence: List[str]
    route_segments: List[RouteSegment]


# Demand Forecast Schemas
class DemandForecastRequest(BaseModel):
    product_id: int
    warehouse_id: int
    forecast_days: int = Field(default=30, ge=1, le=365)


class DemandForecastResponse(BaseModel):
    product_id: int
    warehouse_id: int
    forecast_date: datetime
    predicted_quantity: float
    confidence_interval_lower: float
    confidence_interval_upper: float
    
    class Config:
        from_attributes = True
