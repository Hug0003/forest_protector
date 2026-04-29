import os
from dotenv import load_dotenv
import sys

# Ajoute le dossier parent au path pour importer app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.email_service import EmailService

load_dotenv()

print("Testing Email Service...")
print(f"User: {os.getenv('SMTP_USER')}")
print(f"Dest: {os.getenv('SMTP_DESTINATION')}")

success = EmailService.send_fire_alert(
    forest_name="Test Forest",
    sensor_uid="SENSOR_TEST_001",
    location={"lat": 48.8566, "lng": 2.3522}
)

if success:
    print("Test email SENT successfully!")
else:
    print("Test email FAILED.")
