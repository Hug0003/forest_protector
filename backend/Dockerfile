# Image de base Python légère
FROM python:3.11-slim

# Définit le dossier de travail dans le container
WORKDIR /app

# Copie uniquement requirements.txt d'abord
# (permet le cache Docker — si requirements.txt ne change pas,
#  cette couche est réutilisée sans réinstaller)
COPY requirements.txt .

# Installe les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copie tout le code source
COPY . .

# Expose le port utilisé par FastAPI
EXPOSE 8000

# Lance le serveur avec rechargement automatique (développement)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
