import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from settings import app_settings

def send_email_notification(to_email: str, subject: str, body: str):
    msg = MIMEMultipart()
    msg['From'] = f"{app_settings.smtp_sender_name} <{app_settings.smtp_from}>"
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(app_settings.smtp_host, app_settings.smtp_port) as server:
            server.starttls()
            server.login(app_settings.smtp_user, app_settings.smtp_password)
            server.sendmail(app_settings.smtp_from, to_email, msg.as_string())
    except Exception as e:
        raise Exception(f"Failed to send email: {str(e)}")
