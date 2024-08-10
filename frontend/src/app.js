import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [playlists, setPlaylists] = useState([]);
    const [musicList, setMusicList] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);

    const register = async () => {
        const response = await axios.post('http://localhost/api/user_service/register', { username, password });
        alert(response.data.message);
    };

    const login = async () => {
        const response = await axios.post('http://localhost/api/user_service/login', { username, password });
        alert(response.data.message);
    };

    const getPlaylists = async () => {
        const response = await axios.get(`http://localhost/api/user_service/playlists?username=${username}`);
        setPlaylists(response.data.playlists);
    };

    const uploadMusic = async () => {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const response = await axios.post('http://localhost/api/music_service/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        alert(response.data.message);
        fetchMusicList();
    };

    const fetchMusicList = async () => {
        const response = await axios.get('http://localhost/api/music_service/list');
        setMusicList(response.data);
    };

    const playMusic = async (musicId) => {
        setCurrentTrack(`http://localhost/api/music_service/stream/${musicId}`);
    };

    useEffect(() => {
        fetchMusicList();
    }, []);

    return (
        <div>
            <h1>Spotify Clone</h1>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={register}>Register</button>
            <button onClick={login}>Login</button>
            <button onClick={getPlaylists}>Get Playlists</button>

            <h2>Your Playlists</h2>
            <ul>
                {playlists.map((playlist, index) => (
                    <li key={index}>{playlist}</li>
                ))}
            </ul>

            <h2>Upload Music</h2>
            <input type="file" accept="audio/mp3" onChange={(e) => setSelectedFile(e.target.files[0])} />
            <button onClick={uploadMusic}>Upload</button>

            <h2>Music List</h2>
            <ul>
                {musicList.map((music) => (
                    <li key={music.music_id}>
                        {music.filename} <button onClick={() => playMusic(music.music_id)}>Play</button>
                    </li>
                ))}
            </ul>

            {currentTrack && (
                <div>
                    <h2>Now Playing</h2>
                    <audio controls autoPlay src={currentTrack}>
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
    );
}

export default App;
