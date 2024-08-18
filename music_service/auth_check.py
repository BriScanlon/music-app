import requests
from flask import request, jsonify

AUTH_SERVICE_URL = 'http://auth_service:5004/auth'

def auth_check():
    auth_header = request.headers.get('Authorization')

    if not auth_header:
        return jsonify({"error": "Authorization header missing"}), 401

    token = auth_header.split(" ")[1]  # Assuming the header is in the format "Bearer <token>"

    try:
        response = requests.post(AUTH_SERVICE_URL, json={"token": token})
        response_data = response.json()

        if response.status_code == 200:
            return response_data  # This should include user info, e.g., {"userId": "12345", "username": "johndoe"}
        else:
            return jsonify({"error": "Invalid token"}), 401

    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Authentication service unavailable"}), 503
