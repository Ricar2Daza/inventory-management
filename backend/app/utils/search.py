from sqlalchemy.orm import Query
from sqlalchemy import or_
from typing import List, Any


def search_query(query: Query, model_class: Any, search_term: str, fields: List[str]) -> Query:
    """
    Aplicar búsqueda de texto completo a una query de SQLAlchemy
    
    Args:
        query: Query de SQLAlchemy
        model_class: Clase del modelo
        search_term: Término de búsqueda
        fields: Lista de nombres de campos donde buscar
    
    Returns:
        Query modificada con filtros de búsqueda
    """
    if not search_term or not fields:
        return query
    
    # Crear filtros OR para cada campo
    filters = []
    for field_name in fields:
        if hasattr(model_class, field_name):
            field = getattr(model_class, field_name)
            filters.append(field.ilike(f"%{search_term}%"))
    
    if filters:
        query = query.filter(or_(*filters))
    
    return query
