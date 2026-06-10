"""
Initialize the database for Render deployments.

This script is safe to run repeatedly: it creates tables, seeds demo data only
when the database is empty, and creates the admin user only if it does not exist.
"""
import os
from pathlib import Path

from sqlalchemy.orm import Session

os.chdir(Path(__file__).resolve().parent)

from app.models.database import Base, engine, SessionLocal
from app.models.models import Warehouse, User
from app.utils.auth import get_password_hash
from seed_data import (
    seed_demands,
    seed_inventory,
    seed_products,
    seed_routes,
    seed_vehicles,
    seed_warehouses,
)


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


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data_if_empty(db)
        ensure_admin_user(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
