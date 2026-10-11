import os
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402
from sqlalchemy import select  # noqa: E402

from auth import get_current_user_id  # noqa: E402
from database import Base, SessionLocal, engine  # noqa: E402
from email_service import send_low_stock_email  # noqa: E402
from model import InventoryState, LowStockAlert  # noqa: E402


class InventoryPayload(BaseModel):
    categories: list[dict] = Field(default_factory=list)
    products: list[dict] = Field(default_factory=list)
    suppliers: list[dict] = Field(default_factory=list)
    purchases: list[dict] = Field(default_factory=list)
    sales: list[dict] = Field(default_factory=list)


app = FastAPI(title="InvenPro API", version="1.0.0")
origins = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS", "http://localhost:8443,http://localhost:5173"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/inventory")
def get_inventory(owner_id: str = Depends(get_current_user_id)) -> dict:
    with SessionLocal() as session:
        state = session.get(InventoryState, owner_id)
        if not state:
            return {"state": None}
        return {
            "state": {
                "categories": state.categories,
                "products": state.products,
                "suppliers": state.suppliers,
                "purchases": state.purchases,
                "sales": state.sales,
            },
            "updatedAt": state.updated_at,
        }


def update_low_stock_alerts(session, owner_id: str, payload: InventoryPayload) -> int:
    suppliers = {str(item.get("id")): item for item in payload.suppliers}
    sent = 0

    for product in payload.products:
        product_id = str(product.get("id", ""))
        if not product_id:
            continue
        quantity = int(product.get("quantity", 0))
        reorder_level = int(product.get("reorderLevel", 0))
        is_low = quantity <= reorder_level
        alert = session.scalar(
            select(LowStockAlert).where(
                LowStockAlert.owner_id == owner_id,
                LowStockAlert.product_id == product_id,
            )
        )
        if not alert:
            alert = LowStockAlert(owner_id=owner_id, product_id=product_id)
            session.add(alert)

        if not is_low:
            alert.active = False
        elif not alert.active:
            supplier = suppliers.get(str(product.get("supplierId", "")))
            if supplier and send_low_stock_email(product, supplier):
                alert.active = True
                alert.notified_at = datetime.utcnow()
                sent += 1
        alert.last_quantity = quantity

    return sent


@app.put("/api/inventory")
def save_inventory(
    payload: InventoryPayload,
    owner_id: str = Depends(get_current_user_id),
) -> dict:
    with SessionLocal() as session:
        state = session.get(InventoryState, owner_id)
        values = payload.model_dump()
        if state:
            for field, value in values.items():
                setattr(state, field, value)
        else:
            state = InventoryState(owner_id=owner_id, **values)
            session.add(state)

        emails_sent = update_low_stock_alerts(session, owner_id, payload)
        session.commit()
        return {"saved": True, "supplierEmailsSent": emails_sent}
