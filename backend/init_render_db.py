"""
Initialize the database for Render deployments.

This script is safe to run repeatedly: it creates tables, seeds demo data only
when the database is empty, and creates the admin user only if it does not exist.
"""
import os
from pathlib import Path

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

os.chdir(Path(__file__).resolve().parent)

from app.models.database import Base, engine, SessionLocal
from app.models.models import Driver, Vehicle, Warehouse, User
from app.utils.auth import get_password_hash
from seed_data import (
    seed_demands,
    seed_inventory,
    seed_products,
    seed_routes,
    seed_vehicles,
    seed_warehouses,
)


def ensure_demo_columns() -> None:
    inspector = inspect(engine)
    table_columns = {
        table_name: {column["name"] for column in inspector.get_columns(table_name)}
        for table_name in ["inventory_items", "route_assignments"]
        if inspector.has_table(table_name)
    }

    with engine.begin() as connection:
        inventory_columns = table_columns.get("inventory_items", set())
        if "is_active" not in inventory_columns:
            connection.execute(text("ALTER TABLE inventory_items ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
            connection.execute(text("UPDATE inventory_items SET is_active = TRUE WHERE is_active IS NULL"))

        assignment_columns = table_columns.get("route_assignments", set())
        if "inventory_item_id" not in assignment_columns:
            connection.execute(text("ALTER TABLE route_assignments ADD COLUMN inventory_item_id INTEGER"))
        if "inventory_quantity" not in assignment_columns:
            connection.execute(text("ALTER TABLE route_assignments ADD COLUMN inventory_quantity INTEGER"))
        if "inventory_dispatched" not in assignment_columns:
            connection.execute(text("ALTER TABLE route_assignments ADD COLUMN inventory_dispatched BOOLEAN DEFAULT FALSE"))
            connection.execute(text("UPDATE route_assignments SET inventory_dispatched = FALSE WHERE inventory_dispatched IS NULL"))


def ensure_admin_user(db: Session) -> None:
    admin = db.query(User).filter(User.username == "admin").first()
    if admin:
        print("Admin user already exists")
        return

    admin_user = User(
        username="admin",
        email="admin@logistica.upse.edu.ec",
        hashed_password=get_password_hash("admin123"),
        full_name="Administrador del Sistema",
        is_active=True,
        is_admin=True,
    )
    db.add(admin_user)
    db.commit()
    print("Admin user created: admin / admin123")


def seed_demo_data_if_empty(db: Session) -> None:
    warehouse_count = db.query(Warehouse).count()
    if warehouse_count > 0:
        print(f"Demo data already exists ({warehouse_count} warehouses)")
        return

    warehouses = seed_warehouses(db)
    products = seed_products(db)
    inventory_items = seed_inventory(db, warehouses, products)
    vehicles = seed_vehicles(db, warehouses)
    routes = seed_routes(db, warehouses, vehicles)
    demands = seed_demands(db, warehouses, products)

    print("Demo data created")
    print(f"Warehouses: {len(warehouses)}")
    print(f"Products: {len(products)}")
    print(f"Inventory items: {len(inventory_items)}")
    print(f"Vehicles: {len(vehicles)}")
    print(f"Routes: {len(routes)}")
    print(f"Demand records: {len(demands)}")


def seed_demo_drivers_if_empty(db: Session) -> None:
    driver_count = db.query(Driver).count()
    if driver_count > 0:
        print(f"Demo drivers already exist ({driver_count} drivers)")
        return

    vehicles = db.query(Vehicle).order_by(Vehicle.id).limit(8).all()
    demo_drivers = [
        {
            "first_name": "Carlos",
            "last_name": "Mendoza",
            "id_number": "0923456781",
            "phone": "0998451201",
            "email": "carlos.mendoza@demo.logistica",
            "address": "La Libertad, Santa Elena",
            "license_number": "LIC-DEMO-001",
            "license_type": "C",
            "status": "available",
        },
        {
            "first_name": "María",
            "last_name": "Zambrano",
            "id_number": "0923456782",
            "phone": "0987124302",
            "email": "maria.zambrano@demo.logistica",
            "address": "Salinas, Santa Elena",
            "license_number": "LIC-DEMO-002",
            "license_type": "C",
            "status": "available",
        },
        {
            "first_name": "Jorge",
            "last_name": "Tomalá",
            "id_number": "0923456783",
            "phone": "0976549803",
            "email": "jorge.tomala@demo.logistica",
            "address": "Santa Elena Centro",
            "license_number": "LIC-DEMO-003",
            "license_type": "E",
            "status": "available",
        },
        {
            "first_name": "Andrea",
            "last_name": "Borbor",
            "id_number": "0923456784",
            "phone": "0965432104",
            "email": "andrea.borbor@demo.logistica",
            "address": "Ballenita, Santa Elena",
            "license_number": "LIC-DEMO-004",
            "license_type": "C",
            "status": "available",
        },
        {
            "first_name": "Luis",
            "last_name": "Quimí",
            "id_number": "0923456785",
            "phone": "0954321005",
            "email": "luis.quimi@demo.logistica",
            "address": "Ancón, Santa Elena",
            "license_number": "LIC-DEMO-005",
            "license_type": "B",
            "status": "available",
        },
        {
            "first_name": "Patricia",
            "last_name": "Reyes",
            "id_number": "0923456786",
            "phone": "0943210506",
            "email": "patricia.reyes@demo.logistica",
            "address": "Manglaralto, Santa Elena",
            "license_number": "LIC-DEMO-006",
            "license_type": "C",
            "status": "available",
        },
        {
            "first_name": "Héctor",
            "last_name": "Panchana",
            "id_number": "0923456787",
            "phone": "0932104507",
            "email": "hector.panchana@demo.logistica",
            "address": "Chanduy, Santa Elena",
            "license_number": "LIC-DEMO-007",
            "license_type": "C",
            "status": "off_duty",
        },
        {
            "first_name": "Daniela",
            "last_name": "Suárez",
            "id_number": "0923456788",
            "phone": "0921098708",
            "email": "daniela.suarez@demo.logistica",
            "address": "Olón, Santa Elena",
            "license_number": "LIC-DEMO-008",
            "license_type": "B",
            "status": "inactive",
        },
    ]

    for index, driver_data in enumerate(demo_drivers):
        vehicle = vehicles[index] if index < len(vehicles) else None
        db.add(Driver(
            **driver_data,
            is_active=driver_data["status"] != "inactive",
            assigned_vehicle_id=vehicle.id if vehicle else None,
        ))

    db.commit()
    print(f"Demo drivers created: {len(demo_drivers)}")


def main() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_demo_columns()
    db = SessionLocal()
    try:
        seed_demo_data_if_empty(db)
        seed_demo_drivers_if_empty(db)
        ensure_admin_user(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
