"""
Script para migrar datos de SQLite a PostgreSQL
Sistema de Optimización Logística - UPSE
"""

import sys
import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.models import Base, User, Warehouse, Product, InventoryItem, Vehicle, Route, Demand


# Configuración de bases de datos
SQLITE_URL = "sqlite:///./logistic.db"
POSTGRES_URL = "postgresql+psycopg://logistic_user:logistic_pass@localhost:5432/logistic_db"


def get_table_data(sqlite_session, model):
    """Obtiene todos los registros de una tabla"""
    try:
        return sqlite_session.query(model).all()
    except Exception as e:
        print(f"❌ Error al leer {model.__tablename__}: {e}")
        return []


def migrate_data():
    """
    Migra todos los datos de SQLite a PostgreSQL
    """
    print("🔄 Iniciando migración de SQLite a PostgreSQL...\n")
    
    # Conectar a SQLite
    print("📂 Conectando a SQLite...")
    sqlite_engine = create_engine(SQLITE_URL)
    SQLiteSession = sessionmaker(bind=sqlite_engine)
    sqlite_session = SQLiteSession()
    
    # Conectar a PostgreSQL
    print("🐘 Conectando a PostgreSQL...")
    try:
        postgres_engine = create_engine(POSTGRES_URL)
        PostgresSession = sessionmaker(bind=postgres_engine)
        postgres_session = PostgresSession()
    except Exception as e:
        print(f"❌ Error al conectar a PostgreSQL: {e}")
        print("\n💡 Asegúrate de que:")
        print("   1. Docker esté corriendo")
        print("   2. PostgreSQL esté levantado: docker-compose up -d postgres")
        print("   3. Las credenciales en config.py sean correctas")
        return False
    
    # Crear tablas en PostgreSQL
    print("🏗️  Creando tablas en PostgreSQL...")
    Base.metadata.create_all(postgres_engine)
    
    # Orden de migración (respetando relaciones foreign key)
    models_to_migrate = [
        ('Users', User),
        ('Warehouses', Warehouse),
        ('Products', Product),
        ('Inventory Items', InventoryItem),
        ('Vehicles', Vehicle),
        ('Routes', Route),
        ('Demands', Demand)
    ]
    
    migration_stats = {}
    
    try:
        for model_name, model in models_to_migrate:
            print(f"\n📦 Migrando {model_name}...")
            
            # Obtener datos de SQLite
            records = get_table_data(sqlite_session, model)
            
            if not records:
                print(f"   ⚠️  No hay datos en {model_name}")
                migration_stats[model_name] = 0
                continue
            
            # Insertar en PostgreSQL
            migrated_count = 0
            for record in records:
                try:
                    # Crear diccionario con atributos del registro
                    record_dict = {}
                    for column in inspect(model).columns:
                        col_name = column.name
                        value = getattr(record, col_name)
                        record_dict[col_name] = value
                    
                    # Crear nuevo objeto
                    new_record = model(**record_dict)
                    postgres_session.merge(new_record)  # Usar merge para evitar duplicados
                    migrated_count += 1
                    
                except Exception as e:
                    print(f"   ⚠️  Error migrando registro {record.id}: {e}")
                    continue
            
            # Commit después de cada modelo
            postgres_session.commit()
            migration_stats[model_name] = migrated_count
            print(f"   ✅ {migrated_count} registros migrados")
        
        # Resumen
        print("\n" + "="*60)
        print("📊 RESUMEN DE MIGRACIÓN")
        print("="*60)
        
        total_migrated = 0
        for model_name, count in migration_stats.items():
            print(f"   {model_name}: {count} registros")
            total_migrated += count
        
        print("="*60)
        print(f"   TOTAL: {total_migrated} registros migrados")
        print("="*60)
        
        print("\n✅ Migración completada exitosamente!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        postgres_session.rollback()
        return False
        
    finally:
        sqlite_session.close()
        postgres_session.close()


def verify_migration():
    """
    Verifica que los datos se hayan migrado correctamente
    """
    print("\n🔍 Verificando migración...")
    
    try:
        postgres_engine = create_engine(POSTGRES_URL)
        PostgresSession = sessionmaker(bind=postgres_engine)
        postgres_session = PostgresSession()
        
        models_to_verify = [
            ('Users', User),
            ('Warehouses', Warehouse),
            ('Products', Product),
            ('Inventory Items', InventoryItem),
            ('Vehicles', Vehicle),
            ('Routes', Route),
            ('Demands', Demand)
        ]
        
        print("\n📊 Conteo de registros en PostgreSQL:")
        print("="*60)
        
        for model_name, model in models_to_verify:
            count = postgres_session.query(model).count()
            print(f"   {model_name}: {count} registros")
        
        print("="*60)
        
        postgres_session.close()
        return True
        
    except Exception as e:
        print(f"❌ Error al verificar: {e}")
        return False


def main():
    """
    Función principal
    """
    print("""
╔══════════════════════════════════════════════════════════════╗
║     MIGRACIÓN SQLite → PostgreSQL                            ║
║     Sistema de Optimización Logística - UPSE                 ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    # Confirmar migración
    print("⚠️  ADVERTENCIA:")
    print("   - Este script migrará todos los datos de SQLite a PostgreSQL")
    print("   - Si existen datos en PostgreSQL, se actualizarán")
    print("   - Asegúrate de tener PostgreSQL corriendo (docker-compose up -d postgres)")
    print()
    
    response = input("¿Deseas continuar? (s/n): ").strip().lower()
    
    if response != 's':
        print("❌ Migración cancelada")
        return
    
    # Ejecutar migración
    success = migrate_data()
    
    if success:
        # Verificar migración
        verify_migration()
        
        print("\n✨ ¡Proceso completado!")
        print("\n📝 Próximos pasos:")
        print("   1. Actualiza DATABASE_URL en app/config.py a PostgreSQL")
        print("   2. Reinicia el backend: python -m uvicorn main:app --reload")
        print("   3. Verifica que la API funcione correctamente")
    else:
        print("\n❌ La migración falló. Revisa los errores anteriores.")


if __name__ == "__main__":
    main()
