"""
Script para poblar la base de datos con datos de prueba
Contexto: Sistema logístico para Ecuador (ciudades principales)
"""
import sys
from datetime import datetime, timedelta
from app.models.database import SessionLocal
from app.models.models import Warehouse, Product, InventoryItem, Vehicle, Route, Demand

def seed_warehouses(db):
    """Crear bodegas en ubicaciones estratégicas de la Provincia de Santa Elena"""
    warehouses = [
        # DEPÓSITO PRINCIPAL - UPSE (Todas las rutas deben iniciar y finalizar aquí)
        Warehouse(
            name="UPSE - Depósito Principal",
            address="Universidad Estatal Península de Santa Elena - La Libertad",
            latitude=-2.2336,
            longitude=-80.8650,
            capacity=10000.0
        ),
        Warehouse(
            name="Bodega Central La Libertad",
            address="La Libertad - Centro Comercial, Av. 9 de Octubre",
            latitude=-2.2333,
            longitude=-80.9067,
            capacity=5000.0
        ),
        Warehouse(
            name="Bodega Salinas Malecón",
            address="Salinas - Malecón de Salinas, sector turístico",
            latitude=-2.2147,
            longitude=-80.9558,
            capacity=3500.0
        ),
        Warehouse(
            name="Bodega Santa Elena Centro",
            address="Santa Elena - Av. Eleodoro Solórzano, centro",
            latitude=-2.2269,
            longitude=-80.8586,
            capacity=4000.0
        ),
        Warehouse(
            name="Bodega Manglaralto",
            address="Manglaralto - Ruta del Spondylus E15",
            latitude=-1.9833,
            longitude=-80.7167,
            capacity=2500.0
        ),
        Warehouse(
            name="Bodega Montañita",
            address="Montañita - Vía Principal, zona comercial",
            latitude=-1.8275,
            longitude=-80.7442,
            capacity=2000.0
        ),
        Warehouse(
            name="Bodega Ballenita",
            address="Ballenita - Vía a La Libertad Km 5",
            latitude=-2.2567,
            longitude=-80.8850,
            capacity=2800.0
        ),
        Warehouse(
            name="Bodega Ancón",
            address="Ancón - Zona Industrial Petrolera",
            latitude=-2.3267,
            longitude=-80.8550,
            capacity=3200.0
        ),
        Warehouse(
            name="Bodega Chanduy",
            address="Chanduy - Entrada al poblado",
            latitude=-2.4500,
            longitude=-80.6833,
            capacity=1800.0
        ),
        Warehouse(
            name="Bodega Olón",
            address="Olón - Ruta del Spondylus E15",
            latitude=-1.8514,
            longitude=-80.7403,
            capacity=2200.0
        ),
        Warehouse(
            name="Bodega San Pablo",
            address="San Pablo - Vía Santa Elena - Manglaralto",
            latitude=-2.0500,
            longitude=-80.7500,
            capacity=1500.0
        )
    ]
    
    for warehouse in warehouses:
        db.add(warehouse)
    
    db.commit()
    print(f"✓ Creadas {len(warehouses)} bodegas")
    return warehouses

def seed_products(db):
    """Crear productos típicos de distribución"""
    products = [
        Product(
            sku="ALIM-001",
            name="Arroz Blanco 1kg",
            description="Arroz de grano largo para consumo",
            category="Alimentos Básicos",
            unit_price=1.80,
            weight=1.0,
            volume=0.002
        ),
        Product(
            sku="ALIM-002",
            name="Aceite Vegetal 1L",
            description="Aceite comestible vegetal",
            category="Alimentos Básicos",
            unit_price=3.50,
            weight=0.9,
            volume=0.001
        ),
        Product(
            sku="ALIM-003",
            name="Azúcar Blanca 2kg",
            description="Azúcar refinada para consumo",
            category="Alimentos Básicos",
            unit_price=2.50,
            weight=2.0,
            volume=0.003
        ),
        Product(
            sku="BEBE-001",
            name="Leche en Polvo 900g",
            description="Leche fortificada en polvo",
            category="Bebidas",
            unit_price=12.00,
            weight=0.9,
            volume=0.002
        ),
        Product(
            sku="LACT-001",
            name="Queso Fresco 500g",
            description="Queso fresco pasteurizado",
            category="Lácteos",
            unit_price=4.50,
            weight=0.5,
            volume=0.001
        ),
        Product(
            sku="HIGIE-001",
            name="Jabón de Tocador 125g",
            description="Jabón antibacterial",
            category="Higiene Personal",
            unit_price=1.20,
            weight=0.125,
            volume=0.0002
        ),
        Product(
            sku="LIMP-001",
            name="Detergente en Polvo 1kg",
            description="Detergente multiusos",
            category="Limpieza",
            unit_price=3.20,
            weight=1.0,
            volume=0.0015
        ),
        Product(
            sku="ALIM-004",
            name="Fideos Largos 500g",
            description="Pasta alimenticia",
            category="Alimentos Básicos",
            unit_price=1.30,
            weight=0.5,
            volume=0.001
        )
    ]
    
    for product in products:
        db.add(product)
    
    db.commit()
    print(f"✓ Creados {len(products)} productos")
    return products

def seed_inventory(db, warehouses, products):
    """Crear inventario en cada bodega"""
    import random
    inventory_items = []
    
    for warehouse in warehouses:
        for product in products:
            # Generar cantidad aleatoria (entre 100 y 2000 unidades)
            quantity = random.randint(100, 2000)
            
            item = InventoryItem(
                warehouse_id=warehouse.id,
                product_id=product.id,
                quantity=quantity,
                min_stock=int(quantity * 0.2),
                max_stock=int(quantity * 2),
                reorder_point=int(quantity * 0.3),
                last_restock_date=datetime.now() - timedelta(days=random.randint(0, 30))
            )
            inventory_items.append(item)
            db.add(item)
    
    db.commit()
    print(f"✓ Creados {len(inventory_items)} items de inventario")
    return inventory_items

def seed_vehicles(db, warehouses):
    """Crear vehículos asignados a bodegas"""
    vehicle_types = [
        ("Camión Grande", 8000, 15.5),
        ("Camión Mediano", 5000, 12.0),
        ("Camioneta", 2000, 8.5),
        ("Furgoneta", 1200, 6.0)
    ]
    
    vehicles = []
    
    for idx, warehouse in enumerate(warehouses):
        # Cada bodega tiene 2-4 vehículos
        num_vehicles = 2 if idx < 2 else 3
        
        for i in range(num_vehicles):
            v_type, capacity, cost = vehicle_types[i % len(vehicle_types)]
            
            vehicle = Vehicle(
                plate=f"GXY-{1000 + len(vehicles)}",
                vehicle_type=v_type,
                capacity=capacity,
                max_weight=capacity * 0.8,  # Asumiendo densidad promedio
                fuel_consumption=cost / 2.0  # Litros por km estimado
            )
            vehicles.append(vehicle)
            db.add(vehicle)
    
    db.commit()
    print(f"✓ Creados {len(vehicles)} vehículos")
    return vehicles

def seed_routes(db, warehouses, vehicles):
    """Crear rutas de ejemplo entre bodegas"""
    import random
    routes = []
    
    # Rutas principales entre ciudades (usando índices de warehouses)
    # warehouses[0]=Quito, [1]=Guayaquil, [2]=Cuenca, [3]=Ambato, [4]=Manta
    route_configs = [
        (0, 3, 135.0, 2.5),   # Quito -> Ambato
        (0, 1, 420.0, 7.0),   # Quito -> Guayaquil
        (1, 4, 190.0, 3.5),   # Guayaquil -> Manta
        (2, 1, 245.0, 4.5),   # Cuenca -> Guayaquil
        (3, 2, 210.0, 4.0),   # Ambato -> Cuenca
    ]
    
    for origin_idx, dest_idx, distance, hours in route_configs:
        # Obtener bodegas por índice
        if origin_idx < len(warehouses) and dest_idx < len(warehouses):
            origin = warehouses[origin_idx]
            destination = warehouses[dest_idx]
        
            # Asignar un vehículo aleatorio disponible
            vehicle = vehicles[random.randint(0, len(vehicles) - 1)] if vehicles else None
            
            if vehicle:
                route = Route(
                    vehicle_id=vehicle.id,
                    origin_warehouse_id=origin.id,
                    route_name=f"{origin.name} -> {destination.name}",
                    total_distance=distance,
                    estimated_time=hours,
                    total_cost=distance * (vehicle.fuel_consumption or 1.5) * 1.5,  # costo combustible
                    status="completed" if random.random() > 0.3 else "in_progress",
                    completed_at=datetime.now() - timedelta(days=random.randint(1, 10)) if random.random() > 0.3 else None
                )
                routes.append(route)
                db.add(route)
    
    db.commit()
    print(f"✓ Creadas {len(routes)} rutas")
    return routes

def seed_demands(db, warehouses, products):
    """Crear histórico de demanda para predicción"""
    import random
    demands = []
    
    # Generar demanda de los últimos 12 meses
    for warehouse in warehouses:
        for product in products:
            for months_ago in range(12, 0, -1):
                date = datetime.now() - timedelta(days=30 * months_ago)
                
                # Simular demanda con tendencia y estacionalidad
                base_demand = random.randint(50, 300)
                seasonal_factor = 1.2 if months_ago in [11, 12, 1, 2] else 1.0  # Alta en fin/inicio año
                quantity = int(base_demand * seasonal_factor)
                
                demand = Demand(
                    warehouse_id=warehouse.id,
                    product_id=product.id,
                    forecast_date=date,
                    predicted_quantity=float(quantity),
                    actual_quantity=float(quantity * random.uniform(0.8, 1.2)),  # Variación real
                    confidence_interval_lower=float(quantity * 0.7),
                    confidence_interval_upper=float(quantity * 1.3),
                    model_version="seed_v1"
                )
                demands.append(demand)
                db.add(demand)
    
    db.commit()
    print(f"✓ Creados {len(demands)} registros de demanda histórica")
    return demands

def main():
    """Función principal para ejecutar el seed"""
    print("\n🌱 Iniciando población de base de datos...")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Verificar si ya hay datos
        existing_warehouses = db.query(Warehouse).count()
        if existing_warehouses > 0:
            response = input(f"\n⚠️  Ya existen {existing_warehouses} bodegas. ¿Desea borrar y recrear todos los datos? (y/n): ")
            if response.lower() != 'y':
                print("❌ Operación cancelada")
                return
            
            # Limpiar tablas en orden correcto (respetando foreign keys)
            print("\n🗑️  Limpiando base de datos...")
            db.query(Demand).delete()
            db.query(Route).delete()
            db.query(Vehicle).delete()
            db.query(InventoryItem).delete()
            db.query(Product).delete()
            db.query(Warehouse).delete()
            db.commit()
            print("✓ Base de datos limpia")
        
        # Crear datos
        print("\n📦 Creando datos de prueba...")
        warehouses = seed_warehouses(db)
        products = seed_products(db)
        inventory_items = seed_inventory(db, warehouses, products)
        vehicles = seed_vehicles(db, warehouses)
        routes = seed_routes(db, warehouses, vehicles)
        demands = seed_demands(db, warehouses, products)
        
        print("\n" + "=" * 60)
        print("✅ Base de datos poblada exitosamente!")
        print("\n📊 Resumen:")
        print(f"   • Bodegas: {len(warehouses)}")
        print(f"   • Productos: {len(products)}")
        print(f"   • Items de Inventario: {len(inventory_items)}")
        print(f"   • Vehículos: {len(vehicles)}")
        print(f"   • Rutas: {len(routes)}")
        print(f"   • Registros de Demanda: {len(demands)}")
        print("\n🚀 Puedes probar la API en: http://localhost:8000/api/docs")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
