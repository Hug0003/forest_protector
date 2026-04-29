import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime

class EmailService:
    @staticmethod
    def send_fire_alert(forest_name: str, sensor_uid: str, location: dict):
        smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        smtp_dest = os.getenv("SMTP_DESTINATION")

        if not all([smtp_user, smtp_password, smtp_dest]):
            print("Email credentials missing in .env")
            return False

        subject = f"🔥 ALERTE INCENDIE - {forest_name}"
        
        body = f"""
        ALERTE INCENDIE DÉTECTÉE
        -------------------------
        Forêt : {forest_name}
        Capteur : {sensor_uid}
        Date/Heure : {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
        Coordonnées : {location.get('lat')}, {location.get('lng')}
        
        Lien vers la carte : https://forest-fire.hugomeuriel.fr/map
        
        Action requise immédiate.
        """

        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = smtp_dest
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        try:
            server = smtplib.SMTP(smtp_host, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
            print(f"Email sent successfully for forest {forest_name}")
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
