import sys
import os

# Agregar el directorio actual al path para poder importar app
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.auth import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if user:
            print("El usuario 'admin' ya existe.")
            return

        print("Creando usuario 'admin'...")
        admin_user = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Administrador del Sistema",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("Usuario 'admin' creado exitosamente.")
        print("Usuario: admin")
        print("Contraseña: admin123")
    except Exception as e:
        print(f"Error al crear usuario: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
