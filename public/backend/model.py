from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class InventoryState(Base):
    __tablename__ = "inventory_states"

    owner_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    categories: Mapped[list] = mapped_column(JSON, default=list)
    products: Mapped[list] = mapped_column(JSON, default=list)
    suppliers: Mapped[list] = mapped_column(JSON, default=list)
    purchases: Mapped[list] = mapped_column(JSON, default=list)
    sales: Mapped[list] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class LowStockAlert(Base):
    __tablename__ = "low_stock_alerts"
    __table_args__ = (
        UniqueConstraint("owner_id", "product_id", name="uq_alert_owner_product"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    owner_id: Mapped[str] = mapped_column(String(64), index=True)
    product_id: Mapped[str] = mapped_column(String(64))
    active: Mapped[bool] = mapped_column(Boolean, default=False)
    last_quantity: Mapped[int] = mapped_column(Integer, default=0)
    notified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
