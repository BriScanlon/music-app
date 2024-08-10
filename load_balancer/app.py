from flask import Flask, request, redirect
import requests
import random

app = Flask(__name__)

# Simple in-memory service instances
service_instances = {
    'user_service': ['http://localhost:5001'],
    'music_service': ['http://localhost:5002'],
    'recommend_service': ['http://localhost:5003']
}

@app.route('/<service_name>/*', methods=['GET', 'POST'])
def load_balance(service_name):
    instances = service_instances.get(service_name)
    if not instances:
        return "Service not found", 404
    target_instance = random.choice(instances)
    resp = forward_request(target_instance, service_name)
    return (resp.content, resp.status_code, resp.headers.items())

def forward_request(target_url, service_name):
    target_url = f"{target_url}/{service_name}"
    if request.method == 'POST':
        resp = requests.post(target_url, json=request.json)
    else:
        resp = requests.get(target_url)
    return resp

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004)
