from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    User as UserSchema,
    UserCreate,
    UserUpdate,
    UserChangePassword,
    Token,
    LoginRequest
)
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
    require_role,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registrar un nuevo usuario
    """
    # Verificar si el username ya existe
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El nombre de usuario '{user.username}' ya está en uso"
        )
    
    # Verificar si el email ya existe
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El email '{user.email}' ya está registrado"
        )
    
    # Crear usuario
    user_data = user.model_dump(exclude={"password"})
    user_data["hashed_password"] = get_password_hash(user.password)
    
    db_user = User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login con OAuth2 (para Swagger UI)
    """
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login/json", response_model=Token)
def login_json(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login con JSON (alternativa al OAuth2)
    """
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Obtener información del usuario actual
    """
    return current_user


@router.put("/me", response_model=UserSchema)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar información del usuario actual
    """
    # Solo admin puede cambiar rol
    if user_update.role and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden cambiar roles"
        )
    
    # Verificar email único si se está cambiando
    if user_update.email and user_update.email != current_user.email:
        existing = db.query(User).filter(User.email == user_update.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El email '{user_update.email}' ya está en uso"
            )
    
    # Actualizar campos
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/password")
def change_password(
    password_data: UserChangePassword,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cambiar contraseña del usuario actual
    """
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )
    
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}


@router.get("/users", response_model=List[UserSchema])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Listar todos los usuarios (solo admin)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=UserSchema)
def get_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Obtener usuario por ID (solo admin)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    return user


@router.put("/users/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Actualizar usuario (solo admin)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    # Verificar email único si se está cambiando
    if user_update.email and user_update.email != user.email:
        existing = db.query(User).filter(User.email == user_update.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El email '{user_update.email}' ya está en uso"
            )
    
    # Actualizar campos
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Eliminar usuario (solo admin)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    
    # No permitir que el admin se elimine a sí mismo
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta"
        )
    
    db.delete(user)
    db.commit()
    return None
