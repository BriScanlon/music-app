from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import jwt
import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'

# Enable CORS to allow requests from the frontend
CORS(app, supports_credentials=True)

# Sample user data
users = {
    "testuser": "password123"
}

def create_token(username):
    token = jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    return token

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username in users and users[username] == password:
        token = create_token(username)
        resp = make_response(jsonify({"message": "Login successful"}), 200)
        resp.set_cookie('auth_token', token, httponly=True, secure=False, samesite='Strict')
        return resp
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if username not in users:
        users[username] = password
        token = create_token(username)
        resp = make_response(jsonify({"message": "Registration successful"}), 201)
        resp.set_cookie('auth_token', token, httponly=True, secure=False, samesite='Strict')
        return resp
    return jsonify({"message": "User already exists"}), 400

@app.route('/protected', methods=['GET'])
def protected():
    token = request.cookies.get('auth_token')
    if not token:
        return jsonify({"message": "Token is missing!"}), 401
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        return jsonify({"message": f"Welcome {data['username']}!"})
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token has expired!"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token!"}), 401

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
