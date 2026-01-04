from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.inventory import Client
from app.schemas.inventory import Client as ClientSchema, ClientCreate, ClientUpdate

router = APIRouter(
    prefix="/clients",
    tags=["clients"]
)

@router.get("/", response_model=List[ClientSchema])
def get_clients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Obtener lista de clientes"""
    return db.query(Client).offset(skip).limit(limit).all()

@router.get("/{client_id}", response_model=ClientSchema)
def get_client(client_id: int, db: Session = Depends(get_db)):
    """Obtener un cliente por ID"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client

@router.post("/", response_model=ClientSchema, status_code=status.HTTP_201_CREATED)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    """Crear un nuevo cliente"""
    # Verificar si ya existe por identificación si se provee
    if client.identification:
        existing = db.query(Client).filter(Client.identification == client.identification).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un cliente con esa identificación")
            
    db_client = Client(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.put("/{client_id}", response_model=ClientSchema)
def update_client(client_id: int, client: ClientUpdate, db: Session = Depends(get_db)):
    """Actualizar un cliente"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    update_data = client.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_client, field, value)
        
    db.commit()
    db.refresh(db_client)
    return db_client

@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    """Eliminar un cliente"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    db.delete(db_client)
    db.commit()
    return None
