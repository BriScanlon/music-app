from flask import Flask, request, jsonify
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# MongoDB configuration
mongo_uri = "mongodb://mongodb:27017/spotify"
client = MongoClient(mongo_uri)
db = client.spotify
users_collection = db.users
playlists_collection = db.playlists

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    password = data['password']
    if users_collection.find_one({"username": username}):
        return jsonify({"message": "User already exists"}), 400
    hashed_password = generate_password_hash(password)
    users_collection.insert_one({"username": username, "password": hashed_password})
    playlists_collection.insert_one({"username": username, "playlists": []})
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']
    user = users_collection.find_one({"username": username})
    if user and check_password_hash(user['password'], password):
        return jsonify({"message": "Login successful"}), 200
    return jsonify({"message": "Invalid credentials"}), 401

@app.route('/playlists', methods=['GET', 'POST'])
def manage_playlists():
    username = request.args.get('username')
    if request.method == 'POST':
        playlist = request.json.get('playlist')
        playlists_collection.update_one(
            {"username": username},
            {"$push": {"playlists": playlist}}
        )
        return jsonify({"message": "Playlist added"}), 201
    user_playlists = playlists_collection.find_one({"username": username})
    return jsonify({"playlists": user_playlists.get('playlists', [])}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
