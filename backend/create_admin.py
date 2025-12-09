"""
Create initial admin user
"""
import sys
from sqlalchemy.orm import Session
from app.models.database import SessionLocal, engine, Base
from app.models.models import User
from app.utils.auth import get_password_hash


def create_admin_user():
    """Create initial admin user"""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    
    try:
        # Check if admin user already exists
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("❌ El usuario admin ya existe")
            return
        
        # Create admin user
        password = "admin123"
        hashed_password = get_password_hash(password)
        admin_user = User(
            username="admin",
            email="admin@logistica.upse.edu.ec",
            hashed_password=hashed_password,
            full_name="Administrador del Sistema",
            is_active=True,
            is_admin=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Usuario admin creado exitosamente!")
        print("\n📋 Credenciales:")
        print(f"   • Username: admin")
        print(f"   • Password: {password}")
        print("   • Email: admin@logistica.upse.edu.ec")
        print("\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login")
        
    except Exception as e:
        print(f"❌ Error al crear usuario admin: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()
