import json
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config import settings
from app.database import get_db
from app.auth import require_role
from app.routers.reports import (
    get_inventory_summary,
    get_stock_value,
    get_movements_report,
    get_top_products,
    get_financial_balance,
    get_client_debts,
    get_supplier_debts,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/ai",
    tags=["ai"],
    dependencies=[Depends(require_role("manager"))],
)


class AIReportRequest(BaseModel):
    question: Optional[str] = None


class AIReportResponse(BaseModel):
    answer: str


@router.post("/report-summary", response_model=AIReportResponse)
def get_report_ai_explanation(
    payload: AIReportRequest,
    db: Session = Depends(get_db),
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="El servicio de IA no está configurado. Falta GROQ_API_KEY.",
        )

    inventory_summary = get_inventory_summary(db=db)
    stock_value = get_stock_value(db=db)
    movements = get_movements_report(days=30, db=db)
    top_products = get_top_products(limit=5, days=30, db=db)
    financial_balance = get_financial_balance(days=30, db=db)
    client_debts = get_client_debts(db=db)
    supplier_debts = get_supplier_debts(db=db)

    context = {
        "inventory_summary": inventory_summary.model_dump(),
        "stock_value": stock_value.model_dump(),
        "movements_30_days": movements.model_dump(),
        "top_products_30_days": [
            p.model_dump() for p in top_products.products
        ],
        "financial_balance_30_days": financial_balance.model_dump(),
        "client_debts": client_debts.model_dump(),
        "supplier_debts": supplier_debts.model_dump(),
    }

    user_question = payload.question or (
        "Genera un resumen ejecutivo en español del estado del inventario y las finanzas, "
        "y propone entre 3 y 7 acciones concretas para mejorar el negocio."
    )

    system_prompt = (
        "Eres un asesor experto en gestión de inventario y finanzas de pequeños negocios. "
        "Recibirás datos numéricos en formato JSON sobre inventario, stock, productos más movidos, "
        "balance financiero y deudas de clientes y proveedores. "
        "Debes analizar los datos y responder siempre en español, de forma clara y accionable. "
        "Primero ofrece un breve resumen ejecutivo (2-4 frases) y luego una lista de recomendaciones "
        "concretas, priorizadas. No inventes datos que no aparezcan en el contexto."
    )

    messages = [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": (
                "Contexto numérico de reportes (JSON):\n"
                f"{json.dumps(context, ensure_ascii=False)}\n\n"
                f"Pregunta del usuario: {user_question}"
            ),
        },
    ]

    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.GROQ_MODEL or "llama-3.3-70b-specdec",
                "messages": messages,
                "temperature": 0.3,
            },
            timeout=30.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.error("Error al llamar al servicio Groq: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="No se pudo contactar al servicio de IA.",
        )

    data = response.json()

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        logger.error("Respuesta inesperada de Groq: %s (%s)", data, exc)
        raise HTTPException(
            status_code=503,
            detail="Respuesta inesperada del servicio de IA.",
        )

    return AIReportResponse(answer=content.strip())

