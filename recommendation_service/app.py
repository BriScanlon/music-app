from flask import Flask, jsonify

app = Flask(__name__)

# Simple in-memory store for recommendations
top_songs = ["song1", "song2", "song3"]

@app.route('/recommend/<user_id>', methods=['GET'])
def recommend(user_id):
    return jsonify({"recommendations": top_songs}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003)
