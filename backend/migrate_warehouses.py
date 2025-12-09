"""
Script de migración para agregar columnas nuevas a la tabla warehouses
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'logistic.db')

def migrate():
    print(f"Conectando a la base de datos: {DB_PATH}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Verificar columnas existentes
    cursor.execute("PRAGMA table_info(warehouses)")
    existing_columns = [col[1] for col in cursor.fetchall()]
    print(f"Columnas existentes: {existing_columns}")
    
    # Columnas a agregar
    new_columns = [
        ("location_type", "VARCHAR(50) DEFAULT 'warehouse'"),
        ("contact_name", "VARCHAR(255)"),
        ("contact_phone", "VARCHAR(20)"),
        ("opening_time", "VARCHAR(10)"),
        ("closing_time", "VARCHAR(10)")
    ]
    
    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            print(f"Agregando columna: {col_name}")
            try:
                cursor.execute(f"ALTER TABLE warehouses ADD COLUMN {col_name} {col_type}")
                print(f"  ✓ Columna {col_name} agregada exitosamente")
            except sqlite3.OperationalError as e:
                print(f"  ✗ Error al agregar {col_name}: {e}")
        else:
            print(f"  - Columna {col_name} ya existe")
    
    conn.commit()
    conn.close()
    
    print("\n✓ Migración completada exitosamente")

if __name__ == "__main__":
    migrate()

