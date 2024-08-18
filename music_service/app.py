from flask import Flask, request, send_file, jsonify
import os
import uuid
from pymongo import MongoClient
from auth_check import auth_check  # Ensure this is correctly imported

app = Flask(__name__)

# MongoDB configuration
mongo_uri = "mongodb://mongodb:27017/spotify"
client = MongoClient(mongo_uri)
db = client.spotify
music_collection = db.music

# Directory to store uploaded music files
music_dir = 'music_files'

if not os.path.exists(music_dir):
    os.makedirs(music_dir)

@app.route('/upload', methods=['POST'])
def upload_music():
    # Check authentication
    auth_result = auth_check()
    if isinstance(auth_result, tuple):  # auth_check returns a tuple if there is an error
        return auth_result

    # Proceed with the main logic if authenticated
    music_file = request.files['file']
    artist = request.form.get('artist', 'Unknown Artist')  # Default to "Unknown Artist" if not provided
    user_id = auth_result.get('userId')  # Extract user ID from the auth result

    if music_file and music_file.filename.endswith('.mp3'):
        music_id = str(uuid.uuid4())
        file_path = os.path.join(music_dir, music_id + '.mp3')
        music_file.save(file_path)
        music_collection.insert_one({
            'music_id': music_id,
            'filename': music_file.filename,
            'artist': artist,
            'path': file_path,
            'user_id': user_id  # Associate the uploaded music with the user
        })
        return jsonify({"message": "Music uploaded", "music_id": music_id}), 201
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/stream/<music_id>', methods=['GET'])
def stream_music(music_id):
    # Check authentication
    auth_result = auth_check()
    if isinstance(auth_result, tuple):
        return auth_result

    user_id = auth_result.get('userId')
    music = music_collection.find_one({'music_id': music_id, 'user_id': user_id})  # Ensure user owns the music

    if music and os.path.exists(music['path']):
        return send_file(music['path'])
    return jsonify({"message": "Music not found or access denied"}), 404

@app.route('/list', methods=['GET'])
def list_music():
    # Check authentication
    auth_result = auth_check()
    if isinstance(auth_result, tuple):
        return auth_result

    user_id = auth_result.get('userId')
    music_files = music_collection.find({'user_id': user_id})  # List only the music owned by the user

    return jsonify([
        {
            "music_id": music['music_id'],
            "filename": music['filename'],
            "artist": music.get('artist', 'Unknown Artist')  # Handle cases where artist might not be present
        }
        for music in music_files
    ]), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
