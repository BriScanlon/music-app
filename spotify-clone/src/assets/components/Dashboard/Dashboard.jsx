import React from 'react';
import './Dashboard.css';
import Sidebar from '../Sidebar';
import SuggestedAlbums from '../SuggestedAlbums';
import SuggestedTracks from '../SuggestedTracks';
import PopularPlaylists from '../PopularPlaylists';

function Dashboard() {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <input type="text" placeholder="Search" className="search-bar" />
        </div>
        <SuggestedAlbums />
        <SuggestedTracks />
        <PopularPlaylists />
      </div>
    </div>
  );
}

export default Dashboard;
