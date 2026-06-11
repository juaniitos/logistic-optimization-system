"""
Drivers (Transportistas) management API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.database import get_db
from app.models.schemas import (
    DriverCreate,
    DriverUpdate,
    DriverResponse,
    RouteAssignmentCreate,
    RouteAssignmentUpdate,
    RouteAssignmentResponse
)
from app.models.models import Driver, RouteAssignment, Route, Vehicle, User
from app.utils.auth import get_current_user
from datetime import datetime

router = APIRouter()


# ==================== DRIVER ENDPOINTS ====================

@router.post("/", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(
    driver: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear un nuevo transportista (requiere autenticación)"""
    # Verificar si ya existe un transportista con la misma cédula
    existing = db.query(Driver).filter(Driver.id_number == driver.id_number).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un transportista con este número de identificación"
        )
    
    # Verificar si ya existe un transportista con la misma licencia
    existing_license = db.query(Driver).filter(Driver.license_number == driver.license_number).first()
    if existing_license:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un transportista con este número de licencia"
        )
    
    db_driver = Driver(**driver.model_dump())
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver


@router.get("/", response_model=List[DriverResponse])
async def get_drivers(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Obtener todos los transportistas con filtros opcionales"""
    query = db.query(Driver)
    
    if status:
        query = query.filter(Driver.status == status)
    if is_active is not None:
        query = query.filter(Driver.is_active == is_active)
    
    drivers = query.offset(skip).limit(limit).all()
    return drivers


@router.put("/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: int,
    driver_update: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar un transportista (requiere autenticación)"""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    update_data = driver_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(driver, field, value)
    
    db.commit()
    db.refresh(driver)
    return driver


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un transportista (requiere autenticación)"""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    # Verificar si tiene asignaciones activas
    active_assignments = db.query(RouteAssignment).filter(
        RouteAssignment.driver_id == driver_id,
        RouteAssignment.status.in_(["assigned", "in_progress"])
    ).first()
    
    if active_assignments:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el transportista porque tiene rutas asignadas activas"
        )
    
    db.delete(driver)
    db.commit()
    return None


@router.patch("/{driver_id}/status")
async def update_driver_status(
    driver_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar el estado de un transportista"""
    valid_statuses = ["available", "on_route", "off_duty", "inactive"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Estados válidos: {valid_statuses}"
        )
    
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    driver.status = new_status
    db.commit()
    db.refresh(driver)
    return {"message": "Estado actualizado", "driver": driver}


@router.patch("/{driver_id}/assign-vehicle")
async def assign_vehicle_to_driver(
    driver_id: int,
    vehicle_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Asignar o desasignar un vehículo a un transportista"""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    if vehicle_id:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehículo no encontrado")
        
        # Verificar si el vehículo ya está asignado a otro conductor
        existing_assignment = db.query(Driver).filter(
            Driver.assigned_vehicle_id == vehicle_id,
            Driver.id != driver_id
        ).first()
        if existing_assignment:
            raise HTTPException(
                status_code=400,
                detail=f"El vehículo ya está asignado a {existing_assignment.first_name} {existing_assignment.last_name}"
            )
    
    driver.assigned_vehicle_id = vehicle_id
    db.commit()
    db.refresh(driver)
    return {"message": "Vehículo asignado correctamente" if vehicle_id else "Vehículo desasignado", "driver": driver}


# ==================== ROUTE ASSIGNMENT ENDPOINTS ====================

@router.post("/assignments", response_model=RouteAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_route_assignment(
    assignment: RouteAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Asignar una ruta a un transportista"""
    # Verificar que existe el transportista
    driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    
    # Verificar que el transportista está disponible
    if driver.status not in ["available", "off_duty"]:
        raise HTTPException(
            status_code=400,
            detail="El transportista no está disponible para asignación"
        )
    
    # Verificar que existe la ruta
    route = db.query(Route).filter(Route.id == assignment.route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    
    # Verificar si la ruta ya está asignada y activa
    existing = db.query(RouteAssignment).filter(
        RouteAssignment.route_id == assignment.route_id,
        RouteAssignment.status.in_(["assigned", "in_progress"])
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Esta ruta ya tiene una asignación activa"
        )
    
    assignment_data = assignment.model_dump()
    if not assignment_data.get("vehicle_id") and driver.assigned_vehicle_id:
        assignment_data["vehicle_id"] = driver.assigned_vehicle_id

    db_assignment = RouteAssignment(**assignment_data)
    db.add(db_assignment)
    route.status = "planned"
    
    db.commit()
    db.refresh(db_assignment)
    return db_assignment


@router.get("/assignments", response_model=List[RouteAssignmentResponse])
async def get_route_assignments(
    skip: int = 0,
    limit: int = 100,
    driver_id: Optional[int] = None,
    route_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener asignaciones de rutas con filtros opcionales"""
    query = db.query(RouteAssignment)
    
    if driver_id:
        query = query.filter(RouteAssignment.driver_id == driver_id)
    if route_id:
        query = query.filter(RouteAssignment.route_id == route_id)
    if status:
        query = query.filter(RouteAssignment.status == status)
    
    assignments = query.offset(skip).limit(limit).all()
    return assignments


@router.get("/assignments/{assignment_id}", response_model=RouteAssignmentResponse)
async def get_route_assignment(
    assignment_id: int,
    db: Session = Depends(get_db)
):
    """Obtener una asignación por ID"""
    assignment = db.query(RouteAssignment).filter(RouteAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return assignment


@router.patch("/assignments/{assignment_id}/status")
async def update_assignment_status(
    assignment_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar el estado de una asignación"""
    valid_statuses = ["assigned", "in_progress", "completed", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Estados válidos: {valid_statuses}"
        )
    
    assignment = db.query(RouteAssignment).filter(RouteAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    assignment.status = new_status
    
    # Actualizar timestamps según el estado
    if new_status == "in_progress":
        assignment.started_at = datetime.utcnow()
        driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
        route = db.query(Route).filter(Route.id == assignment.route_id).first()
        if driver:
            driver.status = "on_route"
        if route:
            route.status = "in_progress"
    elif new_status in ["completed", "cancelled"]:
        assignment.completed_at = datetime.utcnow()
        # Liberar al transportista
        driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
        route = db.query(Route).filter(Route.id == assignment.route_id).first()
        if driver:
            driver.status = "available"
        if route:
            route.status = "completed" if new_status == "completed" else "planned"
            if new_status == "completed":
                route.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(assignment)
    return {"message": "Estado de asignación actualizado", "assignment": assignment}


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar una asignación"""
    assignment = db.query(RouteAssignment).filter(RouteAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    # Si la asignación está activa, liberar al transportista
    if assignment.status in ["assigned", "in_progress"]:
        driver = db.query(Driver).filter(Driver.id == assignment.driver_id).first()
        if driver:
            driver.status = "available"
    
    db.delete(assignment)
    db.commit()
    return None


@router.get("/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: int,
    db: Session = Depends(get_db)
):
    """Obtener un transportista por ID"""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Transportista no encontrado")
    return driver


@router.get("/{driver_id}/assignments", response_model=List[RouteAssignmentResponse])
async def get_driver_assignments(
    driver_id: int,
    include_completed: bool = False,
    db: Session = Depends(get_db)
):
    """Obtener todas las asignaciones de un transportista"""
    query = db.query(RouteAssignment).filter(RouteAssignment.driver_id == driver_id)
    
    if not include_completed:
        query = query.filter(RouteAssignment.status.in_(["assigned", "in_progress"]))
    
    assignments = query.all()
    return assignments
