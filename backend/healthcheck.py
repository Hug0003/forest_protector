#!/usr/bin/env python3
"""Healthcheck script for the backend container"""
import socket
import sys
import os

try:
    # Essayer de se connecter pour vérifier que le serveur écoute
    with socket.create_connection(('127.0.0.1', 8000), timeout=5) as sock:
        sock.close()
    sys.exit(0)
except Exception as e:
    sys.exit(1)
