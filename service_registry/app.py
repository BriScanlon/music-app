from flask import Flask, request, jsonify

app = Flask(__name__)

# In-memory store for registered services
registered_services = {}

@app.route('/register', methods=['POST'])
def register_service():
    data = request.json
    service_name = data['name']
    service_url = data['url']
    if service_name and service_url:
        registered_services[service_name] = service_url
        return jsonify({"message": f"Service {service_name} registered successfully."}), 201
    return jsonify({"error": "Invalid data."}), 400

@app.route('/services/<service_name>', methods=['GET'])
def get_service(service_name):
    service_url = registered_services.get(service_name)
    if service_url:
        return jsonify({"url": service_url}), 200
    return jsonify({"error": "Service not found."}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
