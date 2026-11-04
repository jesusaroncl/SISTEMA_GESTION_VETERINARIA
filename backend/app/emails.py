import smtplib
from email.message import EmailMessage
from flask import current_app


def send_email(to, subject, body):
    """Envía un correo por SMTP. Sin SMTP configurado (dev) el contenido queda en los logs."""
    cfg = current_app.config
    if not cfg.get('SMTP_HOST'):
        current_app.logger.warning("SMTP no configurado. Correo para %s | %s\n%s", to, subject, body)
        return
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = cfg['SMTP_FROM']
    msg['To'] = to
    msg.set_content(body)
    with smtplib.SMTP(cfg['SMTP_HOST'], cfg['SMTP_PORT'], timeout=10) as smtp:
        smtp.starttls()
        if cfg.get('SMTP_USER'):
            smtp.login(cfg['SMTP_USER'], cfg['SMTP_PASSWORD'])
        smtp.send_message(msg)
