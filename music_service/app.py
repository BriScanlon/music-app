from flask import Flask, request, send_file, jsonify
import os
import uuid
from pymongo import MongoClient

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
    music_file = request.files['file']
    if music_file and music_file.filename.endswith('.mp3'):
        music_id = str(uuid.uuid4())
        file_path = os.path.join(music_dir, music_id + '.mp3')
        music_file.save(file_path)
        music_collection.insert_one({
            'music_id': music_id,
            'filename': music_file.filename,
            'path': file_path
        })
        return jsonify({"message": "Music uploaded", "music_id": music_id}), 201
    return jsonify({"error": "Invalid file type"}), 400

@app.route('/stream/<music_id>', methods=['GET'])
def stream_music(music_id):
    music = music_collection.find_one({'music_id': music_id})
    if music and os.path.exists(music['path']):
        return send_file(music['path'])
    return jsonify({"message": "Music not found"}), 404

@app.route('/list', methods=['GET'])
def list_music():
    music_files = music_collection.find({})
    return jsonify([
        {"music_id": music['music_id'], "filename": music['filename']}
        for music in music_files
    ]), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
