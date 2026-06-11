"""
Inventory management API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import get_db
from app.models.schemas import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    ProductCreate,
    ProductResponse,
    WarehouseCreate,
    WarehouseUpdate,
    WarehouseResponse
)
from app.models.models import InventoryItem, Product, Warehouse, User, Vehicle
from app.utils.auth import get_current_user

router = APIRouter()


# Warehouse endpoints
@router.post("/warehouses", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    warehouse: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new warehouse/destination point (requires authentication)"""
    db_warehouse = Warehouse(**warehouse.model_dump())
    db.add(db_warehouse)
    db.commit()
    db.refresh(db_warehouse)
    return db_warehouse


@router.get("/warehouses", response_model=List[WarehouseResponse])
async def get_warehouses(
    skip: int = 0,
    limit: int = 100,
    location_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all warehouses/locations with optional filter
    
    - **location_type**: Filter by type (origin, destination, warehouse)
    """
    query = db.query(Warehouse)
    
    if location_type:
        query = query.filter(Warehouse.location_type == location_type)
    
    warehouses = query.offset(skip).limit(limit).all()
    return warehouses


@router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db)
):
    """Get a warehouse/location by ID"""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Bodega/Punto no encontrado")
    return warehouse


@router.put("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def update_warehouse(
    warehouse_id: int,
    warehouse_update: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a warehouse/location (requires authentication)"""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Bodega/Punto no encontrado")
    
    update_data = warehouse_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(warehouse, field, value)
    
    db.commit()
    db.refresh(warehouse)
    return warehouse


@router.delete("/warehouses/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a warehouse/location (requires authentication)"""
    warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Bodega/Punto no encontrado")
    
    # Verificar si tiene items de inventario
    inventory_items = db.query(InventoryItem).filter(InventoryItem.warehouse_id == warehouse_id).first()
    if inventory_items:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar porque tiene items de inventario asociados"
        )
    
    db.delete(warehouse)
    db.commit()
    return None


# Product endpoints
@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    """Create a new product"""
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get all products with optional category filter"""
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    products = query.offset(skip).limit(limit).all()
    return products


# Inventory endpoints
@router.post("/items", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_item(
    item: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new inventory item"""
    warehouse = db.query(Warehouse).filter(Warehouse.id == item.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Bodega no encontrada")

    product = db.query(Product).filter(Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db_item = InventoryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/items", response_model=List[InventoryItemResponse])
async def get_inventory_items(
    warehouse_id: int = None,
    product_id: int = None,
    low_stock: bool = False,
    include_inactive: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get inventory items with optional filters
    
    - **warehouse_id**: Filter by warehouse
    - **product_id**: Filter by product
    - **low_stock**: Show only items below reorder point
    """
    query = db.query(InventoryItem)
    
    if warehouse_id:
        query = query.filter(InventoryItem.warehouse_id == warehouse_id)
    if product_id:
        query = query.filter(InventoryItem.product_id == product_id)
    if low_stock:
        query = query.filter(InventoryItem.quantity <= InventoryItem.reorder_point)
    if not include_inactive:
        query = query.filter(InventoryItem.is_active == True)
    
    items = query.all()
    return items


@router.put("/items/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(
    item_id: int,
    item_update: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an inventory item"""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")

    update_data = item_update.model_dump(exclude_unset=True)
    if "warehouse_id" in update_data:
        warehouse = db.query(Warehouse).filter(Warehouse.id == update_data["warehouse_id"]).first()
        if not warehouse:
            raise HTTPException(status_code=404, detail="Bodega no encontrada")
    if "product_id" in update_data:
        product = db.query(Product).filter(Product.id == update_data["product_id"]).first()
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.patch("/items/{item_id}/status", response_model=InventoryItemResponse)
async def update_inventory_item_status(
    item_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enable or disable an inventory item"""
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")

    item.is_active = is_active
    db.commit()
    db.refresh(item)
    return item


@router.get("/forecast")
async def forecast_demand(
    product_id: int,
    warehouse_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Forecast demand for a product at a warehouse
    """
    from app.services.predictor import DemandPredictor
    
    try:
        predictor = DemandPredictor(db)
        forecast = await predictor.forecast_demand(product_id, warehouse_id, days)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Vehicle endpoints
@router.get("/vehicles")
async def get_vehicles(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all vehicles with optional status filter
    
    - **status**: Filter by status (available, in_use, maintenance)
    """
    query = db.query(Vehicle)
    
    if status:
        query = query.filter(Vehicle.status == status)
    
    vehicles = query.offset(skip).limit(limit).all()
    return vehicles
