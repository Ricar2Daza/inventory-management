from typing import TypeVar, Generic, List, Optional
from pydantic import BaseModel, Field
from fastapi import Query
from sqlalchemy.orm import Query as SQLAlchemyQuery


T = TypeVar('T')


class PaginationParams(BaseModel):
    """Parámetros de paginación"""
    skip: int = Field(0, ge=0, description="Número de registros a saltar")
    limit: int = Field(100, ge=1, le=1000, description="Número máximo de registros a retornar")
    sort_by: Optional[str] = Field(None, description="Campo por el cual ordenar")
    order: str = Field("asc", description="Orden: asc o desc")

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel, Generic[T]):
    """Respuesta paginada genérica"""
    items: List[T]
    total: int = Field(..., description="Total de registros")
    page: int = Field(..., description="Página actual")
    pages: int = Field(..., description="Total de páginas")
    skip: int = Field(..., description="Registros saltados")
    limit: int = Field(..., description="Límite de registros por página")

    class Config:
        from_attributes = True


def get_pagination_params(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    sort_by: Optional[str] = Query(None, description="Campo por el cual ordenar"),
    order: str = Query("asc", description="Orden: asc o desc")
) -> PaginationParams:
    """Dependency para obtener parámetros de paginación"""
    return PaginationParams(skip=skip, limit=limit, sort_by=sort_by, order=order)


def paginate(
    query: SQLAlchemyQuery,
    params: PaginationParams,
    model_class=None
) -> dict:
    """
    Aplicar paginación a una query de SQLAlchemy
    
    Args:
        query: Query de SQLAlchemy
        params: Parámetros de paginación
        model_class: Clase del modelo (opcional, para ordenamiento)
    
    Returns:
        Dict con items y metadata de paginación
    """
    # Contar total de registros
    total = query.count()
    
    # Aplicar ordenamiento si se especifica
    if params.sort_by and model_class:
        if hasattr(model_class, params.sort_by):
            sort_column = getattr(model_class, params.sort_by)
            if params.order.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    
    # Aplicar paginación
    items = query.offset(params.skip).limit(params.limit).all()
    
    # Calcular metadata
    pages = (total + params.limit - 1) // params.limit if params.limit > 0 else 0
    current_page = (params.skip // params.limit) + 1 if params.limit > 0 else 1
    
    return {
        "items": items,
        "total": total,
        "page": current_page,
        "pages": pages,
        "skip": params.skip,
        "limit": params.limit
    }
