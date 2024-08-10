import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '../src/assets/components/LoginPage';
import Dashboard from '../src/assets/components/Dashboard';
import Explore from '../src/assets/components/Explore'; // Add corresponding components for these pages
import Videos from '../src/assets/components/Videos';
import Playlists from '../src/assets/components/Playlists';
import Albums from '../src/assets/components/Albums';
import Tracks from '../src/assets/components/Tracks';
import Artists from '../src/assets/components/Artists';
import CreatePlaylist from '../src/assets/components/CreatePlaylist';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='));
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/explore" element={isAuthenticated ? <Explore /> : <Navigate to="/login" />} />
        <Route path="/videos" element={isAuthenticated ? <Videos /> : <Navigate to="/login" />} />
        <Route path="/playlists" element={isAuthenticated ? <Playlists /> : <Navigate to="/login" />} />
        <Route path="/albums" element={isAuthenticated ? <Albums /> : <Navigate to="/login" />} />
        <Route path="/tracks" element={isAuthenticated ? <Tracks /> : <Navigate to="/login" />} />
        <Route path="/artists" element={isAuthenticated ? <Artists /> : <Navigate to="/login" />} />
        <Route path="/create-playlist" element={isAuthenticated ? <CreatePlaylist /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
