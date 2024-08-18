import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';
import Sidebar from '../Sidebar';

function Dashboard() {
  const [musicList, setMusicList] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchMusicList();
  }, []);

  const fetchMusicList = async () => {
    try {
      const response = await axios.get('/api/music_service/list');
      setMusicList(response.data);
    } catch (error) {
      console.error('Error fetching music list:', error);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const uploadMusic = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/music_service/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(response.data.message);
      fetchMusicList(); // Refresh the music list after upload
      setSelectedFile(null); // Clear the selected file input
    } catch (error) {
      console.error('Error uploading music:', error);
      alert('Music upload failed');
    }
  };

  const playMusic = (musicId) => {
    setCurrentTrack(`/api/music_service/stream/${musicId}`);
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <input type="text" placeholder="Search" className="search-bar" />
          <div className="upload-section">
            <input
              type="file"
              accept="audio/mp3"
              onChange={handleFileChange}
              className="file-input"
            />
            <button onClick={uploadMusic} className="upload-button">
              Upload Music
            </button>
          </div>
        </div>

        <div className="music-list-section">
          <h2>Your Music</h2>
          {musicList.length === 0 ? (
            <p>No music uploaded yet.</p>
          ) : (
            <ul>
              {musicList.map((music) => (
                <li key={music.music_id}>
                  <div className="music-info">
                    <div className="music-title">{music.filename}</div>
                  </div>
                  <button onClick={() => playMusic(music.music_id)}>Play</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {currentTrack && (
          <div className="now-playing">
            <h2>Now Playing</h2>
            <audio controls autoPlay src={currentTrack}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
