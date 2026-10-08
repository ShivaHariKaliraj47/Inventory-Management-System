import html
import os
import smtplib
from email.message import EmailMessage


def send_low_stock_email(product: dict, supplier: dict) -> bool:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_APP_PASSWORD", "")
    sender = os.getenv("SMTP_FROM_EMAIL", username)
    recipient = str(supplier.get("email", "")).strip()
    if not username or not password or not sender or not recipient:
        return False

    name = str(product.get("name", "Product"))
    quantity = int(product.get("quantity", 0))
    reorder_level = int(product.get("reorderLevel", 0))
    supplier_name = str(supplier.get("name", "Supplier"))

    message = EmailMessage()
    message["Subject"] = f"Restock needed: {name}"
    message["From"] = sender
    message["To"] = recipient
    message.set_content(
        f"Hello {supplier_name},\n\n"
        f"We need more stock of {name}. The current quantity is {quantity}, "
        f"which is at or below the reorder level of {reorder_level}.\n\n"
        "Please contact us to arrange the next supply.\n\n"
        "Inventory Management Team"
    )
    message.add_alternative(
        "<h2>Restock request</h2>"
        f"<p>Hello {html.escape(supplier_name)},</p>"
        f"<p>We need more stock of <strong>{html.escape(name)}</strong>.</p>"
        f"<p>Current quantity: <strong>{quantity}</strong><br>"
        f"Reorder level: <strong>{reorder_level}</strong></p>"
        "<p>Please contact us to arrange the next supply.</p>"
        "<p>Inventory Management Team</p>",
        subtype="html",
    )

    try:
        with smtplib.SMTP(host, port, timeout=12) as server:
            server.starttls()
            server.login(username, password)
            server.send_message(message)
        return True
    except (OSError, smtplib.SMTPException):
        return False
